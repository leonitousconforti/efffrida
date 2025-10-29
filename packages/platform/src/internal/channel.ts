import type * as Chunk from "effect/Chunk";
import type * as FridaSink from "../Sink.ts";
import type * as FridaStream from "../Stream.ts";

import * as Channel from "effect/Channel";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as internalSink from "./sink.ts";
import * as internalStream from "./stream.ts";

/** @internal */
export const fromIOStream = <E1, E2>(
    iostream: IOStream,
    onWriteError: (error: unknown) => E1,
    onReadError: (error: unknown) => E2,
    options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
): Channel.Channel<Chunk.Chunk<Uint8Array>, Chunk.Chunk<Uint8Array>, E1 | E2, never, void, unknown, never> => {
    const readChannel = internalSink
        .fromOutputStream(() => iostream.output, onWriteError, { endOnDone: options?.endOnDone })
        .pipe(Sink.toChannel);

    const writeChannel = internalStream
        .fromInputStream(() => iostream.input, onReadError, { chunkSize: options?.chunkSize })
        .pipe(Stream.toChannel);

    return Channel.zip(writeChannel, readChannel, { concurrent: true });
};
