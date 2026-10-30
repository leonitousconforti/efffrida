import type * as Duration from "effect/Duration";
import type * as Function from "effect/Function";

import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Channel from "effect/Channel";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Pull from "effect/Pull";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";

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
export const defaultOnError = (error: unknown): Cause.UnknownError => new Cause.UnknownError(error);

/** @internal */
export const fromInputStream = <E = Cause.UnknownError>(
    options: FromInputStreamOptions & {
        readonly evaluate: Function.LazyArg<InputStream>;
        readonly onError?: ((error: unknown) => E) | undefined;
    }
): Stream.Stream<Uint8Array, E, never> =>
    Stream.fromChannel(
        Channel.fromTransform((_upstream, scope) =>
            Effect.suspend(() => {
                const resource = options.evaluate();
                const onError = options.onError ?? (defaultOnError as (error: unknown) => E);
                const chunkSize = options.chunkSize ?? defaultChunkSize;
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
export const makeUnixInputStream = <E = Cause.UnknownError>(
    options: FromInputStreamOptions &
        UnixStreamOptions & {
            readonly fileDescriptor: number;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
): Stream.Stream<Uint8Array, E, never> =>
    fromInputStream({
        evaluate: () => new UnixInputStream(options.fileDescriptor, options),
        onError: options.onError,
        chunkSize: options.chunkSize,
    });

/** @internal */
export const makeWin32InputStream = <E = Cause.UnknownError>(
    options: FromInputStreamOptions &
        WindowsStreamOptions & {
            readonly handle: NativePointerValue;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
): Stream.Stream<Uint8Array, E, never> =>
    fromInputStream({
        evaluate: () => new Win32InputStream(options.handle, options),
        onError: options.onError,
        chunkSize: options.chunkSize,
    });

const concatBytes = (chunks: Array.NonEmptyReadonlyArray<Uint8Array>): Uint8Array => {
    if (chunks.length === 1) return chunks[0];
    let length = 0;
    for (const chunk of chunks) length += chunk.byteLength;
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return bytes;
};

/**
 * Adapts an effect `Stream` to a Frida `InputStream`. Chunks are pulled from
 * the stream as needed and whatever doesn't fit in a read is kept for the next
 * one.
 *
 * @internal
 */
class StreamAdapter<E, R> implements InputStream {
    private readonly scope: Scope.Closeable;
    private readonly context: Context.Context<R>;
    private readonly pull: Pull.Pull<Array.NonEmptyReadonlyArray<Uint8Array>, E, void>;
    private buffered: Uint8Array = new Uint8Array(0);

    constructor(context: Context.Context<R>, stream: Stream.Stream<Uint8Array, E, R>) {
        this.context = context;
        this.scope = Scope.makeUnsafe();
        this.pull = Effect.runSyncWith(this.context)(Scope.provide(Stream.toPull(stream), this.scope));
    }

    /** Resolves with the next non empty chunk, or undefined when the stream is
     * done. */
    private async next(): Promise<Uint8Array | undefined> {
        while (true) {
            const exit = await Effect.runPromiseExitWith(this.context)(this.pull);
            if (Exit.isSuccess(exit)) {
                const bytes = concatBytes(exit.value);
                if (bytes.byteLength > 0) return bytes;
            } else if (Pull.isDoneCause(exit.cause)) {
                return undefined;
            } else {
                await this.close();
                throw new Error("failure in StreamAdapter", { cause: Cause.squash(exit.cause) });
            }
        }
    }

    public async close(): Promise<void> {
        const exit = await Effect.runPromiseExitWith(this.context)(Scope.close(this.scope, Exit.void));
        if (Exit.isFailure(exit)) {
            throw Cause.squash(exit.cause) as any;
        }
    }

    public async read(size: number): Promise<ArrayBuffer> {
        if (this.buffered.byteLength === 0) {
            const next = await this.next();
            if (next === undefined) return new ArrayBuffer(0);
            this.buffered = next;
        }

        const bytes = this.buffered.slice(0, size);
        this.buffered = this.buffered.subarray(bytes.byteLength);
        return bytes.buffer;
    }

    public async readAll(size: number): Promise<ArrayBuffer> {
        const bytes = new Uint8Array(size);
        let offset = 0;
        while (offset < size) {
            const data = await this.read(size - offset);
            if (data.byteLength === 0) {
                const error = new Error("Premature end of stream");
                (error as any).partialData = bytes.slice(0, offset).buffer;
                throw error;
            }
            bytes.set(new Uint8Array(data), offset);
            offset += data.byteLength;
        }

        return bytes.buffer;
    }
}

/** @internal */
export const toInputStream = <E, R>(stream: Stream.Stream<Uint8Array, E, R>): Effect.Effect<InputStream, never, R> =>
    Effect.map(Effect.context<R>(), (context) => new StreamAdapter(context, stream));

/** @internal */
export const toInputStreamNever = <E>(stream: Stream.Stream<Uint8Array, E, never>): InputStream =>
    new StreamAdapter(Context.empty(), stream);
