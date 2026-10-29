/**
 * Effect `Channel` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Array from "effect/Array";
import type * as Channel from "effect/Channel";

import type * as FridaSink from "./Sink.ts";
import type * as FridaStream from "./Stream.ts";

import * as internal from "./internal/channel.ts";

/**
 * Bidirectional byte channel over an `IOStream`: upstream chunks are written to
 * `iostream.output` and chunks read from `iostream.input` are emitted. The
 * channel completes once both sides are done, and the `IOStream` is closed when
 * the channel finishes.
 *
 * @since 1.0.0
 * @category Channel
 * @see https://frida.re/docs/javascript-api/#iostream
 */
export const fromIOStream: <E1, E2, IE = never>(
    iostream: IOStream,
    onWriteError: (error: unknown) => E1,
    onReadError: (error: unknown) => E2,
    options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
) => Channel.Channel<
    Array.NonEmptyReadonlyArray<Uint8Array>,
    E1 | E2 | IE,
    void,
    Array.NonEmptyReadonlyArray<Uint8Array>,
    IE,
    unknown,
    never
> = internal.fromIOStream;
