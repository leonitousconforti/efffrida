import * as Array from "effect/Array";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Function from "effect/Function";
import * as Latch from "effect/Latch";
import * as Layer from "effect/Layer";
import * as NetAddress from "effect/net/NetAddress";
import * as Result from "effect/Result";
import * as Scope from "effect/Scope";
import * as Semaphore from "effect/Semaphore";
import * as EffectSocket from "effect/socket/Socket";
import * as SocketServer from "effect/socket/SocketServer";

import * as internalBytes from "./bytes.ts";
import * as internalStream from "./stream.ts";

const openError = (cause: unknown): EffectSocket.SocketError =>
    new EffectSocket.SocketError({ reason: new EffectSocket.SocketOpenError({ kind: "Unknown", cause }) });

const closeError = (code: number, closeReason?: string | undefined): EffectSocket.SocketError =>
    new EffectSocket.SocketError({ reason: new EffectSocket.SocketCloseError({ code, closeReason }) });

const toBytes = (chunk: Uint8Array | string): Uint8Array =>
    typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk;

/**
 * Awaits a promised connection, closing it if the waiting fiber was interrupted
 * before the promise settled so that it does not leak.
 */
const awaitConnection = <E>(
    evaluate: Function.LazyArg<Promise<SocketConnection>>,
    onError: (cause: unknown) => E
): Effect.Effect<SocketConnection, E, never> =>
    Effect.callback<SocketConnection, E>((resume) => {
        let interrupted = false;
        evaluate().then(
            (connection) => {
                if (interrupted) connection.close().catch(Function.constVoid);
                else resume(Effect.succeed(connection));
            },
            (cause: unknown) => resume(Effect.fail(onError(cause)))
        );
        return Effect.sync(() => {
            interrupted = true;
        });
    });

/**
 * Builds an Effect `Socket` from a Frida `SocketConnection` acquisition.
 *
 * Each reader acquisition runs `open` in the reader scope and closes the
 * connection when that scope closes. Reads are pull based: one
 * `InputStream.read` is in flight at most, and only while a pull is waiting.
 * End of stream fails the pull with a `SocketCloseError` with code 1000. Writes
 * go through `OutputStream.writeAll`, one at a time. Frida has no half-close,
 * so releasing the writer does not signal end of stream to the peer; write a
 * `CloseEvent` or close the reader scope to close the connection.
 *
 * @internal
 */
export const fromSocketConnection = <R>(
    open: Effect.Effect<SocketConnection, EffectSocket.SocketError, R>,
    options?: { readonly chunkSize?: number | undefined } | undefined
): Effect.Effect<EffectSocket.Socket, never, Exclude<R, Scope.Scope>> =>
    Effect.withFiber((fiber) => {
        let current:
            | {
                  readonly connection: SocketConnection;
                  readonly close: (error: EffectSocket.SocketError) => void;
              }
            | undefined;
        const latch = Latch.makeUnsafe(false);
        const writeLock = Semaphore.makeUnsafe(1);
        const openContext = fiber.context as Context.Context<R>;
        const chunkSize = options?.chunkSize ?? internalStream.defaultChunkSize;

        const reader: EffectSocket.Socket["reader"] = Effect.gen(function* () {
            const scope = yield* Effect.scope;
            const connection = yield* Scope.provide(open, scope);

            type ReadResume = (
                effect: Effect.Effect<Array.NonEmptyReadonlyArray<Uint8Array>, EffectSocket.SocketError>
            ) => void;

            let error: EffectSocket.SocketError | undefined;
            let waiter: ReadResume | undefined;
            // Bytes read while no pull was waiting, delivered to the next pull
            let pending: Uint8Array | undefined;
            let reading = false;

            function deliver(): void {
                if (waiter === undefined) return;
                let result: Effect.Effect<Array.NonEmptyReadonlyArray<Uint8Array>, EffectSocket.SocketError>;
                if (pending !== undefined) {
                    result = Effect.succeed(Array.of(pending));
                    pending = undefined;
                } else if (error !== undefined) {
                    result = Effect.fail(error);
                } else {
                    return read();
                }
                const resume = waiter;
                waiter = undefined;
                resume(result);
            }

            function read(): void {
                if (reading) return;
                reading = true;
                connection.input.read(chunkSize).then(
                    (buffer) => {
                        reading = false;
                        if (error === undefined) {
                            if (buffer.byteLength === 0) error = closeError(1000);
                            else pending = new Uint8Array(buffer);
                        }
                        deliver();
                    },
                    (cause: unknown) => {
                        reading = false;
                        error ??= new EffectSocket.SocketError({ reason: new EffectSocket.SocketReadError({ cause }) });
                        deliver();
                    }
                );
            }

            // Teardown or close event: unread bytes are discarded
            function close(err: EffectSocket.SocketError): void {
                error ??= err;
                pending = undefined;
                deliver();
            }

            yield* Scope.addFinalizer(
                scope,
                Effect.suspend(() => {
                    // Resume a pull blocked in another fiber before closing
                    close(closeError(1006));
                    latch.closeUnsafe();
                    if (current?.connection === connection) current = undefined;
                    return Effect.promise(() => connection.close().catch(Function.constVoid));
                })
            );

            current = { connection, close };
            latch.openUnsafe();

            const pull = Effect.callback<Array.NonEmptyReadonlyArray<Uint8Array>, EffectSocket.SocketError>(
                (resume) => {
                    waiter = resume;
                    deliver();
                    // Resumed synchronously, nothing to cancel
                    if (waiter !== resume) return;
                    return Effect.sync(() => {
                        if (waiter === resume) waiter = undefined;
                    });
                }
            );

            return { pull, upgrade: EffectSocket.SocketUpgradeError.unsupported };
        }).pipe(Effect.updateContext((input: Context.Context<Scope.Scope>) => Context.merge(openContext, input)));

        const writeBytes = (
            connection: SocketConnection,
            bytes: Uint8Array
        ): Effect.Effect<void, EffectSocket.SocketError> =>
            Effect.tryPromise({
                try: () => connection.output.writeAll(internalBytes.toArrayBuffer(bytes)),
                catch: (cause) =>
                    new EffectSocket.SocketError({ reason: new EffectSocket.SocketWriteError({ cause }) }),
            });

        const write = (
            chunk: Uint8Array | string | EffectSocket.CloseEvent
        ): Effect.Effect<void, EffectSocket.SocketError> =>
            Effect.suspend(() => {
                const conn = current;
                if (conn === undefined) return latch.whenOpen(write(chunk));
                if (EffectSocket.isCloseEvent(chunk)) {
                    conn.close(closeError(chunk.code, chunk.reason));
                    return Effect.promise(() => conn.connection.close().catch(Function.constVoid));
                }
                return writeLock.withPermit(writeBytes(conn.connection, toBytes(chunk)));
            });

        const writeAll = (
            chunks: Array.NonEmptyReadonlyArray<Uint8Array | string>
        ): Effect.Effect<void, EffectSocket.SocketError> =>
            Effect.suspend(() => {
                const conn = current;
                if (conn === undefined) return latch.whenOpen(writeAll(chunks));
                return writeLock.withPermit(
                    writeBytes(conn.connection, internalBytes.concat(Array.map(chunks, toBytes)))
                );
            });

        const writer: EffectSocket.Socket["writer"] = Effect.succeed({ write, writeAll });

        return Effect.succeed(EffectSocket.make({ reader, writer }));
    });

/** @internal */
export const liftSocketConnection = (
    socketConnection: SocketConnection
): Effect.Effect<EffectSocket.Socket, never, never> => fromSocketConnection(Effect.succeed(socketConnection));

/** @internal */
export const connect = (options: SocketConnectOptions): Effect.Effect<EffectSocket.Socket, never, never> =>
    fromSocketConnection(awaitConnection(() => Socket.connect(options), openError));

/** @internal */
export const listen = (options?: SocketListenOptions | undefined): Effect.Effect<EffectSocket.Socket, never, never> =>
    fromSocketConnection(
        Effect.acquireUseRelease(
            Effect.tryPromise({ try: () => Socket.listen(options), catch: openError }),
            (socketListener) => awaitConnection(() => socketListener.accept(), openError),
            (socketListener) => Effect.promise(() => socketListener.close())
        )
    );

const serverOpenError = (cause: unknown): SocketServer.SocketServerError =>
    new SocketServer.SocketServerError({ reason: new SocketServer.SocketServerOpenError({ cause }) });

const serverUnknownError = (cause: unknown): SocketServer.SocketServerError =>
    new SocketServer.SocketServerError({ reason: new SocketServer.SocketServerUnknownError({ cause }) });

const listenerAddress = (
    socketListener: SocketListener,
    options: SocketListenOptions | undefined
): NetAddress.SocketAddress => {
    if ("path" in socketListener) return NetAddress.unixPathAddress(socketListener.path);
    const tcpOptions = options as TcpListenOptions | undefined;
    const unspecified = tcpOptions?.family === "ipv4" ? "0.0.0.0" : "::";
    return Result.getOrElse(
        NetAddress.inetAddressFromIpString(tcpOptions?.host ?? unspecified, socketListener.port),
        () => NetAddress.inetAddressFromIpStringUnsafe(unspecified, socketListener.port)
    );
};

/** @internal */
export const makeServer = Effect.fnUntraced(function* (options?: SocketListenOptions | undefined) {
    const socketListener = yield* Effect.acquireRelease(
        Effect.tryPromise({ try: () => Socket.listen(options), catch: serverOpenError }),
        (socketListener) => Effect.promise(() => socketListener.close())
    );

    // Frida listeners support a single pending accept, so concurrent runs take
    // turns
    const acceptLock = Semaphore.makeUnsafe(1);
    const accept = acceptLock.withPermit(awaitConnection(() => socketListener.accept(), serverUnknownError));

    const run = Effect.fnUntraced(function* <R, E, _>(
        handler: (socket: EffectSocket.Socket) => Effect.Effect<_, E, R>
    ) {
        const scope = yield* Scope.make();
        const services = Context.omit(Scope.Scope)(yield* Effect.context<R>()) as Context.Context<R>;
        const trackFiber = Fiber.runIn(scope);

        const onConnection = (connection: SocketConnection): void =>
            Function.pipe(
                fromSocketConnection(Effect.succeed(connection)),
                Effect.flatMap(handler),
                Effect.ignoreCause({ log: "Unhandled", message: "Unhandled error in SocketServer" }),
                Effect.ensuring(Effect.promise(() => connection.close().catch(Function.constVoid))),
                Effect.runForkWith(services),
                trackFiber,
                Function.constVoid
            );

        return yield* Effect.forever(Effect.map(accept, onConnection)).pipe(
            Effect.ensuring(Scope.close(scope, Exit.void))
        );
    });

    return SocketServer.SocketServer.of({
        address: listenerAddress(socketListener, options),
        run,
    });
});

/** @internal */
export const layerServer = (
    options?: SocketListenOptions | undefined
): Layer.Layer<SocketServer.SocketServer, SocketServer.SocketServerError, never> =>
    Layer.effect(SocketServer.SocketServer)(makeServer(options));
