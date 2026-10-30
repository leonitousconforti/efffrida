import type * as Array from "effect/Array";
import type * as Cause from "effect/Cause";
import type * as Function from "effect/Function";

import * as Channel from "effect/Channel";
import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

import type * as FridaSink from "../Sink.ts";
import type * as FridaStream from "../Stream.ts";

import * as internalSink from "./sink.ts";
import * as internalStream from "./stream.ts";

/** @internal */
export const fromIOStream = <E1 = Cause.UnknownError, E2 = Cause.UnknownError, IE = never>(
    options: FridaStream.FromInputStreamOptions &
        FridaSink.FromWritableOptions & {
            readonly evaluate: Function.LazyArg<IOStream>;
            readonly onWriteError?: ((error: unknown) => E1) | undefined;
            readonly onReadError?: ((error: unknown) => E2) | undefined;
        }
): Channel.Channel<
    Array.NonEmptyReadonlyArray<Uint8Array>,
    E1 | E2 | IE,
    void,
    Array.NonEmptyReadonlyArray<Uint8Array>,
    IE,
    unknown,
    never
> =>
    Channel.suspend(() => {
        const iostream = options.evaluate();

        // A sink's types hide upstream errors and the upstream done value, but
        // at runtime upstream failures propagate through the sink's pull and
        // the done value is ignored, so the input side can be widened safely.
        const writeChannel = internalSink
            .fromOutputStream({
                evaluate: () => iostream.output,
                onError: options.onWriteError,
                endOnDone: options.endOnDone,
            })
            .pipe(
                Sink.toChannel,
                Channel.mapDone(() => void 0)
            ) as Channel.Channel<never, E1 | IE, void, Array.NonEmptyReadonlyArray<Uint8Array>, IE, unknown, never>;

        const readChannel = internalStream
            .fromInputStream({
                evaluate: () => iostream.input,
                onError: options.onReadError,
                chunkSize: options.chunkSize,
            })
            .pipe(Stream.toChannel);

        return Channel.merge(readChannel, writeChannel).pipe(Channel.ensuring(Effect.promise(() => iostream.close())));
    });
