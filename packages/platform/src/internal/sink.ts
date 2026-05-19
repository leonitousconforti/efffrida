import type * as Function from "effect/Function";

import * as Effect from "effect/Effect";
import * as Pull from "effect/Pull";
import * as Sink from "effect/Sink";

import type { FromWritableOptions } from "../Sink.ts";

/** @internal */
export const sendSink = (): Sink.Sink<void, string, never, never, never> =>
    Sink.forEach((message) => Effect.sync(() => send(message)));

/** @internal */
export const fromOutputStream = <E>(
    evaluate: Function.LazyArg<OutputStream>,
    onError: (error: unknown) => E,
    options?: FromWritableOptions | undefined
): Sink.Sink<void, Uint8Array, never, E, never> =>
    Sink.fromTransform((upstream) => {
        const writable = evaluate();
        const close = options?.endOnDone ? Effect.promise(() => writable.close()) : Effect.void;

        return Effect.gen(function* () {
            while (true) {
                const chunks = yield* upstream;
                for (const c of chunks) {
                    yield* Effect.tryPromise({ try: () => writable.writeAll(Array.from(c)), catch: onError });
                }
            }
        }).pipe(
            Effect.ensuring(close),
            Pull.catchDone(() => Effect.succeed([void 0] as const))
        );
    });

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
