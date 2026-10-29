import type * as Duration from "effect/Duration";
import type * as Function from "effect/Function";

import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Channel from "effect/Channel";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import * as Pull from "effect/Pull";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";

import * as Buffer from "node:buffer";
import * as util from "node:util";

import type { FromInputStreamOptions } from "../Stream.ts";

interface ReceivedMessage {
    message: string;
    data?: Uint8Array | undefined;
}

/**
 * Frida's `recv` is a one-shot registration that cannot be cancelled, so a
 * registration whose waiter was interrupted would otherwise swallow the next
 * message. Registrations are shared through this module level state instead: a
 * message that arrives with no waiter is kept for the next one, in order.
 */
const recvState: {
    registered: number;
    readonly waiters: Array<(message: ReceivedMessage) => void>;
    readonly leftovers: Array<ReceivedMessage>;
} = { registered: 0, waiters: [], leftovers: [] };

const onRecv = (message: string, data: ArrayBuffer | null): void => {
    recvState.registered--;
    const received: ReceivedMessage = { message, data: data !== null ? new Uint8Array(data) : undefined };
    const waiter = recvState.waiters.shift();
    if (waiter !== undefined) waiter(received);
    else recvState.leftovers.push(received);
};

const recvOnce: Effect.Effect<ReceivedMessage, never, never> = Effect.callback<ReceivedMessage>((resume) => {
    const leftover = recvState.leftovers.shift();
    if (leftover !== undefined) {
        resume(Effect.succeed(leftover));
        return;
    }

    const waiter = (message: ReceivedMessage): void => resume(Effect.succeed(message));
    recvState.waiters.push(waiter);
    if (recvState.registered < recvState.waiters.length) {
        recvState.registered++;
        recv(onRecv);
    }

    return Effect.sync(() => {
        const index = recvState.waiters.indexOf(waiter);
        if (index !== -1) recvState.waiters.splice(index, 1);
    });
});

/** @internal */
export const receiveStream = (
    shareOptions:
        | {
              readonly capacity: "unbounded";
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.Input | undefined;
          }
        | {
              readonly capacity: number;
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.Input | undefined;
          }
): Effect.Effect<Stream.Stream<ReceivedMessage, never, never>, never, Scope.Scope> =>
    Stream.fromEffectRepeat(recvOnce).pipe(Stream.share(shareOptions));

/** @internal */
export const defaultChunkSize = 64 * 1024;

/** @internal */
export const fromInputStream = <E>(
    inputStream: Function.LazyArg<InputStream>,
    onError: (error: unknown) => E,
    options?: FromInputStreamOptions | undefined
): Stream.Stream<Uint8Array, E, never> =>
    Stream.fromChannel(
        Channel.fromTransform((_upstream, scope) =>
            Effect.suspend(() => {
                const resource = inputStream();
                const chunkSize = options?.chunkSize ? Number(options.chunkSize) : defaultChunkSize;
                const read = Effect.flatMap(
                    Effect.tryPromise({ try: () => resource.read(chunkSize), catch: onError }),
                    (buffer): Pull.Pull<Array.NonEmptyReadonlyArray<Uint8Array>, E> =>
                        buffer.byteLength > 0 ? Effect.succeed(Array.of(new Uint8Array(buffer))) : Cause.done()
                );

                return Effect.as(
                    Scope.addFinalizer(
                        scope,
                        Effect.promise(() => resource.close())
                    ),
                    read
                );
            })
        )
    );

/** @internal */
export const makeUnixInputStream = <E>(
    fileDescriptor: number,
    onError: (error: unknown) => E,
    options?: (FromInputStreamOptions & UnixStreamOptions) | undefined
): Stream.Stream<Uint8Array, E, never> =>
    fromInputStream(() => new UnixInputStream(fileDescriptor, options), onError, options);

/** @internal */
export const makeWin32InputStream = <E>(
    handle: NativePointerValue,
    onError: (error: unknown) => E,
    options?: (FromInputStreamOptions & WindowsStreamOptions) | undefined
): Stream.Stream<Uint8Array, E, never> =>
    fromInputStream(() => new Win32InputStream(handle, options), onError, options);

/**
 * Stream adapter for converting an Effect stream to an InputStream. Modified
 * from the effect platform-node toReadable implementation.
 *
 * @internal
 * @link
 * https://github.com/Effect-TS/effect/blob/03c048ced2f7aa2357be52c62ef8e62e9da50817/packages/platform-node-shared/src/internal/stream.ts#L319-L372
 */
class StreamAdapter<E, R> implements InputStream {
    private readonly scope: Scope.Closeable;
    private readonly pull: (callback: (error: Error | null, data: Option.Option<number>) => void) => void;

    private readonly context: Context.Context<R>;
    private readonly stream: Stream.Stream<Uint8Array, E, R>;

    constructor(_context: Context.Context<R>, _stream: Stream.Stream<Uint8Array, E, R>) {
        this.context = _context;
        this.stream = _stream;
        this.scope = Scope.makeUnsafe();
        const pullEffect = this.stream.pipe(
            Stream.flatMap((arr) => Stream.fromIterable(arr)),
            Stream.rechunk(1),
            Stream.toPull,
            Scope.provide(this.scope)
        );
        const pull = Effect.runSyncWith(this.context)(pullEffect).pipe(
            Effect.map((arr) => Option.some(arr[0])),
            Pull.catchDone(() => Effect.succeed(Option.none<number>()))
        );
        this.pull = function (done) {
            Effect.runForkWith(this.context)(pull).addObserver((exit: Exit.Exit<Option.Option<number>, E>) => {
                done(
                    exit._tag === "Failure"
                        ? new Error("failure in StreamAdapter", { cause: Cause.squash(exit.cause) })
                        : null,
                    exit._tag === "Success" ? exit.value : Option.none<number>()
                );
            });
        };
    }

    private async loop(size: number): Promise<ArrayBuffer> {
        let bytesRead = 0;
        const buffer = Buffer.Buffer.alloc(size);
        const pullAsync = util.promisify(this.pull.bind(this));

        try {
            // Process data in an async loop
            for (let i = 0; i < size; i++) {
                const data = await pullAsync();

                if (Option.isNone(data)) {
                    bytesRead = i;
                    break;
                }

                buffer.writeUInt8(data.value, i);
                bytesRead++;
            }

            if (bytesRead === size) {
                return buffer.buffer;
            } else {
                const newBuffer = Buffer.Buffer.alloc(bytesRead);
                buffer.copy(newBuffer, 0, 0, bytesRead);
                return newBuffer.buffer;
            }
        } catch (error) {
            await this.close();
            throw error;
        }
    }

    public async close(): Promise<void> {
        const exit = await Effect.runPromiseExitWith(this.context)(Scope.close(this.scope, Exit.void));
        if (Exit.isFailure(exit)) {
            throw Cause.squash(exit.cause) as any;
        }
    }

    public read(size: number): Promise<ArrayBuffer> {
        return this.loop(size);
    }

    public async readAll(size: number): Promise<ArrayBuffer> {
        const data = await this.loop(size);
        if (data.byteLength < size) {
            const error = new Error("Premature end of stream");
            (error as any).partialData = data;
            throw error;
        }

        return data;
    }
}

/** @internal */
export const toInputStream = <E, R>(stream: Stream.Stream<Uint8Array, E, R>): Effect.Effect<InputStream, never, R> =>
    Effect.map(Effect.context<R>(), (context) => new StreamAdapter(context, stream));

/** @internal */
export const toInputStreamNever = <E>(stream: Stream.Stream<Uint8Array, E, never>): InputStream =>
    new StreamAdapter(Context.empty(), stream);
