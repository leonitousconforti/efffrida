import { Cause, Data, Effect, Stream } from "effect";

import { describe, expect, it } from "@effect/vitest";

class ReadError extends Data.TaggedError("ReadError")<{ message: string }> {}

import * as FridaStream from "@efffrida/platform/Stream";

describe("stream tests", () => {
    it.effect("roundtrips stream -> inputstream -> stream", () =>
        Effect.gen(function* () {
            const originalData = new Uint8Array([1, 2, 3, 4, 5]);
            const originalStream = Stream.make(originalData);
            const inputStream = FridaStream.toInputStreamNever(originalStream);

            const reconstructedStream = FridaStream.fromInputStream({
                evaluate: () => inputStream,
                onError: (e) => new ReadError({ message: `Read error: ${e}` }),
                chunkSize: 1,
            });

            const result = yield* Stream.runCollect(reconstructedStream);
            const allBytes = result.flatMap((arr) => Array.from(arr));
            expect(allBytes).toEqual([1, 2, 3, 4, 5]);
        })
    );

    it.effect("reads across chunk boundaries", () =>
        Effect.gen(function* () {
            const inputStream = FridaStream.toInputStreamNever(
                Stream.make(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5]), new Uint8Array([6, 7, 8, 9])).pipe(
                    Stream.rechunk(1)
                )
            );

            const first = yield* Effect.promise(() => inputStream.read(2));
            const second = yield* Effect.promise(() => inputStream.read(4));
            const rest = yield* Effect.promise(() => inputStream.readAll(5));
            const last = yield* Effect.promise(() => inputStream.read(4));
            const end = yield* Effect.promise(() => inputStream.read(4));

            expect(Array.from(new Uint8Array(first))).toEqual([1, 2]);
            expect(Array.from(new Uint8Array(second))).toEqual([3]);
            expect(Array.from(new Uint8Array(rest))).toEqual([4, 5, 6, 7, 8]);
            expect(Array.from(new Uint8Array(last))).toEqual([9]);
            expect(end.byteLength).toBe(0);
        })
    );

    it.effect("readAll fails with the partial data on a premature end", () =>
        Effect.gen(function* () {
            const inputStream = FridaStream.toInputStreamNever(Stream.make(new Uint8Array([1, 2, 3])));
            const error = yield* Effect.promise(() =>
                inputStream.readAll(5).then(
                    () => undefined,
                    (e: unknown) => e
                )
            );

            expect(error).toBeInstanceOf(Error);
            expect(Array.from(new Uint8Array((error as { partialData: ArrayBuffer }).partialData))).toEqual([1, 2, 3]);
        })
    );

    it.effect("reads a stream with async setup", () =>
        Effect.gen(function* () {
            const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
            const inputStream = FridaStream.toInputStreamNever(
                Stream.fromPull(
                    Effect.sleep("10 millis").pipe(
                        Effect.as(
                            Effect.suspend(() => {
                                const chunk = chunks.shift();
                                return chunk === undefined ? Cause.done() : Effect.succeed([chunk] as const);
                            })
                        )
                    )
                )
            );

            const first = yield* Effect.promise(() => inputStream.read(2));
            const rest = yield* Effect.promise(() => inputStream.readAll(3));
            const end = yield* Effect.promise(() => inputStream.read(4));
            yield* Effect.promise(() => inputStream.close());

            expect(Array.from(new Uint8Array(first))).toEqual([1, 2]);
            expect(Array.from(new Uint8Array(rest))).toEqual([3, 4, 5]);
            expect(end.byteLength).toBe(0);
        })
    );
});
