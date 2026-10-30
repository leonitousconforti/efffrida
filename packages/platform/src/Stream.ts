/**
 * Effect `Stream` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Cause from "effect/Cause";
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
    /** Size passed to each `InputStream.read` call, defaults to 64 KiB. */
    readonly chunkSize?: number | undefined;
}

/**
 * Receives the messages posted by the host, shared with `Stream.share` using
 * the given options.
 *
 * Frida's `recv` registrations are shared module wide, so every message is
 * delivered once across all `receiveStream`s: two of them split the messages
 * between each other instead of both seeing every message. Call it once and
 * share the resulting stream.
 *
 * @since 1.0.0
 * @category IPC
 */
export const receiveStream: (
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
 * Reads from a Frida `InputStream`, which is closed when the stream finishes.
 * Errors are mapped with `onError`, defaulting to `Cause.UnknownError`.
 *
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#inputstream
 */
export const fromInputStream: <E = Cause.UnknownError>(
    options: FromInputStreamOptions & {
        readonly evaluate: Function.LazyArg<InputStream>;
        readonly onError?: ((error: unknown) => E) | undefined;
    }
) => Stream.Stream<Uint8Array, E, never> = internal.fromInputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#unixinputstream
 */
export const makeUnixInputStream: <E = Cause.UnknownError>(
    options: FromInputStreamOptions &
        UnixStreamOptions & {
            readonly fileDescriptor: number;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
) => Stream.Stream<Uint8Array, E, never> = internal.makeUnixInputStream;

/**
 * @since 1.0.0
 * @category Constructors
 * @see https://frida.re/docs/javascript-api/#win32inputstream
 */
export const makeWin32InputStream: <E = Cause.UnknownError>(
    options: FromInputStreamOptions &
        WindowsStreamOptions & {
            readonly handle: NativePointerValue;
            readonly onError?: ((error: unknown) => E) | undefined;
        }
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
