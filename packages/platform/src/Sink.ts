/**
 * Effect `Sink` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Cause from "effect/Cause";
import type * as Function from "effect/Function";
import type * as Sink from "effect/Sink";

import * as internal from "./internal/sink.ts";

/**
 * @since 1.0.0
 * @category Types
 */
export interface FromWritableOptions {
    /** Whether to close the `OutputStream` when the sink is done, defaults to
     * `true`. */
    readonly endOnDone?: boolean | undefined;
}

/**
 * Sends each string to the host with Frida's `send`.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const sendSink: Sink.Sink<void, string, never, never, never> = internal.sendSink;

/**
 * Writes to a Frida `OutputStream`. Errors are mapped with `onError`,
 * defaulting to `Cause.UnknownError`.
 *
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#outputstream
 */
export const fromOutputStream: <E = Cause.UnknownError>(
    options: FromWritableOptions & {
        readonly evaluate: Function.LazyArg<OutputStream>;
        readonly onError?: ((error: unknown) => E) | undefined;
    }
) => Sink.Sink<void, Uint8Array, never, E, never> = internal.fromOutputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#unixoutputstream
 */
export const makeUnixOutputStream: <E = Cause.UnknownError>(
    options: FromWritableOptions &
        UnixStreamOptions & {
            readonly fileDescriptor: number;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
) => Sink.Sink<void, Uint8Array, never, E, never> = internal.makeUnixOutputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#win32outputstream
 */
export const makeWin32OutputStream: <E = Cause.UnknownError>(
    options: FromWritableOptions &
        WindowsStreamOptions & {
            readonly handle: NativePointerValue;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
) => Sink.Sink<void, Uint8Array, never, E, never> = internal.makeWin32OutputStream;
