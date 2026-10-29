import type * as Array from "effect/Array";

import * as Channel from "effect/Channel";
import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

import type * as FridaSink from "../Sink.ts";
import type * as FridaStream from "../Stream.ts";

import * as internalSink from "./sink.ts";
import * as internalStream from "./stream.ts";

/** @internal */
export const fromIOStream = <E1, E2, IE = never>(
    iostream: IOStream,
    onWriteError: (error: unknown) => E1,
    onReadError: (error: unknown) => E2,
    options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
): Channel.Channel<
    Array.NonEmptyReadonlyArray<Uint8Array>,
    E1 | E2 | IE,
    void,
    Array.NonEmptyReadonlyArray<Uint8Array>,
    IE,
    unknown,
    never
> => {
    // A sink's types hide upstream errors and the upstream done value, but at
    // runtime upstream failures propagate through the sink's pull and the done
    // value is ignored, so the input side can be widened safely.
    const writeChannel = internalSink
        .fromOutputStream(() => iostream.output, onWriteError, { endOnDone: options?.endOnDone })
        .pipe(
            Sink.toChannel,
            Channel.mapDone(() => void 0)
        ) as Channel.Channel<never, E1 | IE, void, Array.NonEmptyReadonlyArray<Uint8Array>, IE, unknown, never>;

    const readChannel = internalStream
        .fromInputStream(() => iostream.input, onReadError, { chunkSize: options?.chunkSize })
        .pipe(Stream.toChannel);

    return Channel.merge(readChannel, writeChannel).pipe(Channel.ensuring(Effect.promise(() => iostream.close())));
};
