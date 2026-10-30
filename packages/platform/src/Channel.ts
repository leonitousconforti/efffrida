/**
 * Effect `Channel` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Array from "effect/Array";
import type * as Cause from "effect/Cause";
import type * as Channel from "effect/Channel";
import type * as Function from "effect/Function";

import type * as FridaSink from "./Sink.ts";
import type * as FridaStream from "./Stream.ts";

import * as internal from "./internal/channel.ts";

/**
 * Bidirectional byte channel over an `IOStream`: upstream chunks are written to
 * `iostream.output` and chunks read from `iostream.input` are emitted. The
 * channel completes once both sides are done, and the `IOStream` is closed when
 * the channel finishes. Unless `endOnDone` is `false`, the output side is also
 * closed as soon as upstream is done.
 *
 * @since 1.0.0
 * @category Channel
 * @see https://frida.re/docs/javascript-api/#iostream
 */
export const fromIOStream: <E1 = Cause.UnknownError, E2 = Cause.UnknownError, IE = never>(
    options: FridaStream.FromInputStreamOptions &
        FridaSink.FromWritableOptions & {
            readonly evaluate: Function.LazyArg<IOStream>;
            readonly onWriteError?: ((error: unknown) => E1) | undefined;
            readonly onReadError?: ((error: unknown) => E2) | undefined;
        }
) => Channel.Channel<
    Array.NonEmptyReadonlyArray<Uint8Array>,
    E1 | E2 | IE,
    void,
    Array.NonEmptyReadonlyArray<Uint8Array>,
    IE,
    unknown,
    never
> = internal.fromIOStream;
