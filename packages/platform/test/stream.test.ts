import { describe, expect, it } from "@effect/vitest";
import { Chunk, Effect, Stream } from "effect";

import * as FridaStream from "@efffrida/platform/Stream";

describe("stream tests", () => {
    it.effect("roundtrips stream -> inputstream -> stream", () =>
        Effect.gen(function* () {
            const originalData = new Uint8Array([1, 2, 3, 4, 5]);
            const originalStream = Stream.make(originalData);
            const inputStream = FridaStream.toInputStreamNever(originalStream);

            const reconstructedStream = FridaStream.fromInputStream(
                () => inputStream,
                (e) => new Error(`Read error: ${e}`),
                { chunkSize: 1 }
            );

            const result = yield* Stream.runCollect(reconstructedStream);
            const allBytes = Chunk.toArray(result).flatMap((arr) => Array.from(arr));
            expect(allBytes).toEqual([1, 2, 3, 4, 5]);
        })
    );
});
