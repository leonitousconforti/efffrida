/**
 * Effect `Channel` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Channel from "effect/Channel";
import type * as Chunk from "effect/Chunk";
import type * as FridaSink from "./Sink.js";
import type * as FridaStream from "./Stream.js";

import * as internal from "./internal/channel.js";

export const fromIOStream: <E1, E2>(
    iostream: IOStream,
    onWriteError: (error: unknown) => E1,
    onReadError: (error: unknown) => E2,
    options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
) => Channel.Channel<Chunk.Chunk<Uint8Array>, Chunk.Chunk<Uint8Array>, E1 | E2, never, void, unknown, never> =
    internal.fromIOStream;
