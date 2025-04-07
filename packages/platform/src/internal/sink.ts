import type * as Function from "effect/Function";
import type * as SingleProducerAsyncInput from "effect/SingleProducerAsyncInput";
import type { FromWritableOptions } from "../Sink.js";

import * as Channel from "effect/Channel";
import * as Chunk from "effect/Chunk";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";

/** @internal */
export const sendSink = (): Sink.Sink<void, string, never, never, never> =>
    Sink.forEach((message) => Effect.sync(() => send(message)));

/** @internal */
export const fromOutputStream = <E>(
    evaluate: Function.LazyArg<OutputStream>,
    onError: (error: unknown) => E,
    options?: FromWritableOptions | undefined
): Sink.Sink<void, Uint8Array, never, E, never> =>
    Effect.gen(function* () {
        const writable = evaluate();
        const deferred = yield* Deferred.make<void, E>();

        const write = (chunk: Chunk.Chunk<Uint8Array>) =>
            Effect.gen(function* () {
                for (const c of chunk) {
                    yield* Effect.promise(() => writable.writeAll(Array.from(c)));
                }
            });

        const close = options?.endOnDone ? Effect.promise(() => writable.close()) : Effect.void;

        return Channel.fromEffect(deferred)
            .pipe(Channel.mapOut(Chunk.empty))
            .pipe(Channel.mapError(onError))
            .pipe(
                Channel.embedInput({
                    emit: write,
                    awaitRead: () => Effect.void,
                    error: (cause) => Effect.zipRight(close, Deferred.failCause(deferred, cause)),
                    done: (_) => Effect.zipRight(close, Deferred.complete(deferred, Effect.void)),
                } as SingleProducerAsyncInput.AsyncInputProducer<E, Chunk.Chunk<Uint8Array>, unknown>)
            );
    })
        .pipe(Channel.unwrap)
        .pipe(Sink.fromChannel);

/** @internal */
export const makeUnixOutputStream = <E>(
    fileDescriptor: number,
    onError: (error: unknown) => E,
    options?: (UnixStreamOptions & FromWritableOptions) | undefined
): Sink.Sink<void, Uint8Array, never, E, never> =>
    fromOutputStream(() => new UnixOutputStream(fileDescriptor, options), onError, { endOnDone: options?.endOnDone });

/** @internal */
export const makeWin32OutputStream = <E>(
    handle: NativePointerValue,
    onError: (error: unknown) => E,
    options?: (WindowsStreamOptions & FromWritableOptions) | undefined
): Sink.Sink<void, Uint8Array, never, E, never> =>
    fromOutputStream(() => new Win32OutputStream(handle, options), onError, { endOnDone: options?.endOnDone });
