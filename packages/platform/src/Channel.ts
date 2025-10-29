/**
 * Effect `Channel` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Channel from "effect/Channel";
import type * as Chunk from "effect/Chunk";
import type * as FridaSink from "./Sink.ts";
import type * as FridaStream from "./Stream.ts";

import * as internal from "./internal/channel.ts";

/**
 * @since 1.0.0
 * @category Channel
 * @see https://frida.re/docs/javascript-api/#iostream
 */
export const fromIOStream: <E1, E2>(
    iostream: IOStream,
    onWriteError: (error: unknown) => E1,
    onReadError: (error: unknown) => E2,
    options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
) => Channel.Channel<Chunk.Chunk<Uint8Array>, Chunk.Chunk<Uint8Array>, E1 | E2, never, void, unknown, never> =
    internal.fromIOStream;
