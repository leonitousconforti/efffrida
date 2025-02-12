/**
 * Effect `Stream` utilities for Frida.
 *
 * @since 1.0.0
 */

import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

import * as internal from "./internal/stream.js";
import { InputStreamError } from "./internal/stream.js";

export {
    /**
     * @since 1.0.0
     * @category Errors
     */
    InputStreamError,
};

/**
 * @since 1.0.0
 * @category IPC
 */
export const receiveStream: (
    bufferSize?: internal.BufferAndChunkSizes["bufferSize"] | undefined
) => Stream.Stream<{ message: string; data?: Uint8Array | undefined }, never, never> = internal.receiveStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see @see https://frida.re/docs/javascript-api/#inputstream
 */
export const fromInputStream: <OnError extends (error: unknown) => any = (error: unknown) => InputStreamError>(
    inputStream: InputStream,
    onError?: OnError | undefined,
    options?: internal.BufferAndChunkSizes | undefined
) => Stream.Stream<Uint8Array, ReturnType<OnError>, never> = internal.fromInputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#unixinputstream
 */
export const makeUnixInputStream: <OnError extends (error: unknown) => any = (error: unknown) => InputStreamError>(
    fileDescriptor: number,
    onError?: OnError | undefined,
    options?: (internal.BufferAndChunkSizes & UnixStreamOptions) | undefined
) => Stream.Stream<Uint8Array, ReturnType<OnError>, never> = internal.makeUnixInputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#win32inputstream
 */
export const makeWin32InputStream: <OnError extends (error: unknown) => any = (error: unknown) => InputStreamError>(
    handle: NativePointerValue,
    onError?: OnError | undefined,
    options?: (internal.BufferAndChunkSizes & WindowsStreamOptions) | undefined
) => Stream.Stream<Uint8Array, ReturnType<OnError>, never> = internal.makeWin32InputStream;

/**
 * @since 1.0.0
 * @category Destructors
 * @see https://frida.re/docs/javascript-api/#inputstream
 */
export const toInputStream: <E, R>(stream: Stream.Stream<Uint8Array, E, R>) => Effect.Effect<InputStream, never, R> =
    internal.toInputStream;

/**
 * Like {@link toInputStream} but with `R` fixed to `never`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const toInputStreamNever: <E>(stream: Stream.Stream<Uint8Array, E, never>) => InputStream =
    internal.toInputStreamNever;

/**
 * @since 1.0.0
 * @category Transformations
 */
export const encodeText: <E, R>(self: Stream.Stream<string, E, R>) => Stream.Stream<Uint8Array, E, R> =
    internal.encodeText;

/**
 * @since 1.0.0
 * @category Transformations
 */
export const decodeText: {
    (
        encoding?: BufferEncoding | undefined
    ): <E, R>(self: Stream.Stream<Uint8Array, E, R>) => Stream.Stream<string, E, R>;
    <E, R>(self: Stream.Stream<Uint8Array, E, R>, encoding?: BufferEncoding | undefined): Stream.Stream<string, E, R>;
} = internal.decodeText;
