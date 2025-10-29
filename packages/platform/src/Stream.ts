/**
 * Effect `Stream` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as FileSystem from "@effect/platform/FileSystem";
import type * as Duration from "effect/Duration";
import type * as Effect from "effect/Effect";
import type * as Function from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";

import * as internal from "./internal/stream.ts";

/**
 * @since 1.0.0
 * @category Types
 */
export interface FromInputStreamOptions {
    readonly chunkSize?: FileSystem.SizeInput | undefined;
}

/**
 * @since 1.0.0
 * @category IPC
 */
export const receiveStream: (
    shareOptions:
        | {
              readonly capacity: "unbounded";
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.DurationInput | undefined;
          }
        | {
              readonly capacity: number;
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.DurationInput | undefined;
          }
) => Effect.Effect<
    Stream.Stream<
        {
            message: string;
            data?: Uint8Array | undefined;
        },
        never,
        never
    >,
    never,
    Scope.Scope
> = internal.receiveStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#inputstream
 */
export const fromInputStream: <E>(
    evaluate: Function.LazyArg<InputStream>,
    onError: (error: unknown) => E,
    options?: FromInputStreamOptions | undefined
) => Stream.Stream<Uint8Array, E, never> = internal.fromInputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#unixinputstream
 */
export const makeUnixInputStream: <E>(
    fileDescriptor: number,
    onError: (error: unknown) => E,
    options?: (FromInputStreamOptions & UnixStreamOptions) | undefined
) => Stream.Stream<Uint8Array, E, never> = internal.makeUnixInputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#win32inputstream
 */
export const makeWin32InputStream: <E>(
    handle: NativePointerValue,
    onError: (error: unknown) => E,
    options?: (FromInputStreamOptions & WindowsStreamOptions) | undefined
) => Stream.Stream<Uint8Array, E, never> = internal.makeWin32InputStream;

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
export const encodeText: {
    (
        encoding?: BufferEncoding | undefined
    ): <E, R>(self: Stream.Stream<string, E, R>) => Stream.Stream<Uint8Array, E, R>;
    <E, R>(self: Stream.Stream<string, E, R>, encoding?: BufferEncoding | undefined): Stream.Stream<Uint8Array, E, R>;
} = internal.encodeText;

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
