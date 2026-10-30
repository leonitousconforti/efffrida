import type * as Cause from "effect/Cause";
import type * as Function from "effect/Function";

import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";

import type { FromWritableOptions } from "../Sink.ts";

import { defaultOnError } from "./stream.ts";

/** @internal */
export const sendSink: Sink.Sink<void, string, never, never, never> = Sink.forEach((message) =>
    Effect.sync(() => send(message))
);

/** Frida only takes an `ArrayBuffer` or an array of numbers, so copy only when
 * the view doesn't cover its buffer. */
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? (bytes.buffer as ArrayBuffer)
        : bytes.slice().buffer;

/** @internal */
export const fromOutputStream = <E = Cause.UnknownError>(
    options: FromWritableOptions & {
        readonly evaluate: Function.LazyArg<OutputStream>;
        readonly onError?: ((error: unknown) => E) | undefined;
    }
): Sink.Sink<void, Uint8Array, never, E, never> =>
    Sink.suspend(() => {
        const writable = options.evaluate();
        const onError = options.onError ?? (defaultOnError as (error: unknown) => E);
        const sink = Sink.forEachArray((chunks: ReadonlyArray<Uint8Array>) =>
            Effect.forEach(
                chunks,
                (chunk) => Effect.tryPromise({ try: () => writable.writeAll(toArrayBuffer(chunk)), catch: onError }),
                { discard: true }
            )
        );

        return options.endOnDone === false
            ? sink
            : Sink.ensuring(
                  sink,
                  Effect.promise(() => writable.close())
              );
    });

/** @internal */
export const makeUnixOutputStream = <E = Cause.UnknownError>(
    options: FromWritableOptions &
        UnixStreamOptions & {
            readonly fileDescriptor: number;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
): Sink.Sink<void, Uint8Array, never, E, never> =>
    fromOutputStream({
        evaluate: () => new UnixOutputStream(options.fileDescriptor, options),
        onError: options.onError,
        endOnDone: options.endOnDone,
    });

/** @internal */
export const makeWin32OutputStream = <E = Cause.UnknownError>(
    options: FromWritableOptions &
        WindowsStreamOptions & {
            readonly handle: NativePointerValue;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
): Sink.Sink<void, Uint8Array, never, E, never> =>
    fromOutputStream({
        evaluate: () => new Win32OutputStream(options.handle, options),
        onError: options.onError,
        endOnDone: options.endOnDone,
    });
