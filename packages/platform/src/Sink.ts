/**
 * Effect `Sink` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Function from "effect/Function";

import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";

import * as internal from "./internal/sink.js";

/**
 * @since 1.0.0
 * @category Constructors
 */
export const sendSink = (): Sink.Sink<void, string, never, never, never> =>
    Sink.forEach((message) => Effect.sync(() => send(message)));

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#outputstream
 */
export const fromOutputStream: <E, A = Uint8Array>(
    evaluate: Function.LazyArg<OutputStream>,
    onError: (error: unknown) => E
) => Sink.Sink<void, A, never, E, never> = internal.fromOutputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#unixoutputstream
 */
export const makeUnixOutputStream: <E>(
    fileDescriptor: number,
    onError: (error: unknown) => E,
    options?: UnixStreamOptions | undefined
) => Sink.Sink<void, Uint8Array, never, E, never> = internal.makeUnixOutputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#win32outputstream
 */
export const makeWin32OutputStream: <E>(
    handle: NativePointerValue,
    onError: (error: unknown) => E,
    options?: WindowsStreamOptions | undefined
) => Sink.Sink<void, Uint8Array, never, E, never> = internal.makeWin32OutputStream;
