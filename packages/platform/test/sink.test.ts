import { describe, expect, it } from "@effect/vitest";
import { Effect, Stream } from "effect";

import * as FridaSink from "@efffrida/platform/Sink";

describe("sink tests", () => {
    it.effect("writes data to an OutputStream created from a stream", () =>
        Effect.gen(function* () {
            let collected: Array<number> = [];

            const mockOutputStream: OutputStream = {
                async close() {},
                async write(_data: Array<number> | ArrayBuffer | Uint8Array) {
                    return 0;
                },
                async writeAll(data: Array<number> | ArrayBuffer | Uint8Array) {
                    if (Array.isArray(data)) {
                        collected = collected.concat(data);
                    } else if (data instanceof Uint8Array) {
                        collected = collected.concat(Array.from(data));
                    } else {
                        collected = collected.concat(Array.from(new Uint8Array(data)));
                    }
                },
                async writeMemoryRegion(_address: NativePointerValue, _size: number) {
                    return _size;
                },
            };

            const sink = FridaSink.fromOutputStream(
                () => mockOutputStream,
                (e) => new Error(`Write error: ${e}`),
                { endOnDone: true }
            );

            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            yield* Stream.make(testData).pipe(Stream.run(sink));

            expect(collected).toEqual([1, 2, 3, 4, 5]);
        })
    );

    it.effect("writes multiple chunks", () =>
        Effect.gen(function* () {
            let collected: Array<number> = [];

            const mockOutputStream: OutputStream = {
                async close() {},
                async write(_data: Array<number> | ArrayBuffer | Uint8Array) {
                    return 0;
                },
                async writeAll(data: Array<number> | ArrayBuffer | Uint8Array) {
                    if (Array.isArray(data)) {
                        collected = collected.concat(data);
                    } else if (data instanceof Uint8Array) {
                        collected = collected.concat(Array.from(data));
                    } else {
                        collected = collected.concat(Array.from(new Uint8Array(data)));
                    }
                },
                async writeMemoryRegion(_address: NativePointerValue, _size: number) {
                    return _size;
                },
            };

            const sink = FridaSink.fromOutputStream(
                () => mockOutputStream,
                (e) => new Error(`Write error: ${e}`),
                { endOnDone: true }
            );

            const chunk1 = new Uint8Array([1, 2, 3]);
            const chunk2 = new Uint8Array([4, 5, 6]);
            yield* Stream.make(chunk1, chunk2).pipe(Stream.run(sink));

            expect(collected).toEqual([1, 2, 3, 4, 5, 6]);
        })
    );

    it.effect("handles empty stream", () =>
        Effect.gen(function* () {
            let collected: Array<number> = [];

            const mockOutputStream: OutputStream = {
                async close() {},
                async write(_data: Array<number> | ArrayBuffer | Uint8Array) {
                    return 0;
                },
                async writeAll(data: Array<number> | ArrayBuffer | Uint8Array) {
                    if (Array.isArray(data)) {
                        collected = collected.concat(data);
                    } else if (data instanceof Uint8Array) {
                        collected = collected.concat(Array.from(data));
                    } else {
                        collected = collected.concat(Array.from(new Uint8Array(data)));
                    }
                },
                async writeMemoryRegion(_address: NativePointerValue, _size: number) {
                    return _size;
                },
            };

            const sink = FridaSink.fromOutputStream(
                () => mockOutputStream,
                (e) => new Error(`Write error: ${e}`),
                { endOnDone: true }
            );

            yield* (Stream.empty as Stream.Stream<Uint8Array>).pipe(Stream.run(sink));

            expect(collected).toEqual([]);
        })
    );
});
