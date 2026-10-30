import { Data, Effect, Stream } from "effect";
import * as EffectSocket from "effect/socket/Socket";

import { describe, expect, it } from "@effect/vitest";
import * as FridaChannel from "@efffrida/platform/Channel";
import * as FridaSocket from "@efffrida/platform/Socket";
import * as FridaStream from "@efffrida/platform/Stream";

class ReadError extends Data.TaggedError("ReadError")<{ cause: unknown }> {}
class WriteError extends Data.TaggedError("WriteError")<{ cause: unknown }> {}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBytes = (data: ArrayBuffer | Array<number>): Array<number> =>
    Array.isArray(data) ? data : Array.from(new Uint8Array(data));

describe("channel tests", () => {
    it.effect("reads from input, writes to output and closes the IOStream", () =>
        Effect.gen(function* () {
            const written: Array<number> = [];
            let closed = false;

            const iostream: IOStream = {
                input: FridaStream.toInputStreamNever(Stream.make(new Uint8Array([1, 2, 3, 4, 5]))),
                output: {
                    async close() {},
                    async write(data) {
                        written.push(...toBytes(data));
                        return toBytes(data).length;
                    },
                    async writeAll(data) {
                        written.push(...toBytes(data));
                    },
                    async writeMemoryRegion(_address, size) {
                        return size;
                    },
                },
                async close() {
                    closed = true;
                },
            };

            const channel = FridaChannel.fromIOStream({
                evaluate: () => iostream,
                onWriteError: (cause) => new WriteError({ cause }),
                onReadError: (cause) => new ReadError({ cause }),
            });

            const read = yield* Stream.make(new Uint8Array([9, 8]), new Uint8Array([7])).pipe(
                Stream.pipeThroughChannel(channel),
                Stream.runCollect
            );

            expect(read.flatMap((chunk) => Array.from(chunk))).toEqual([1, 2, 3, 4, 5]);
            expect(written).toEqual([9, 8, 7]);
            expect(closed).toBe(true);
        })
    );

    it.effect("talks to a TCP server through a SocketConnection", () =>
        Effect.gen(function* () {
            const server = yield* FridaSocket.makeServer({ family: "ipv4", host: "127.0.0.1" });
            if (server.address._tag === "UnixPathAddress") throw new Error("expected an inet address");
            const port = server.address.port;

            // Reads a request, answers it in upper case and closes the connection
            yield* Effect.forkScoped(
                server.run((socket) =>
                    Effect.scoped(
                        Effect.gen(function* () {
                            const { pull } = yield* socket.reader;
                            const writer = yield* socket.writer;
                            let request = "";
                            while (request.length < 4) {
                                for (const chunk of yield* pull) {
                                    request += typeof chunk === "string" ? chunk : decoder.decode(chunk);
                                }
                            }
                            yield* writer.write(request.toUpperCase());
                            yield* writer.write(new EffectSocket.CloseEvent());
                        })
                    )
                )
            );

            const connection = yield* Effect.promise(() => Socket.connect({ host: "127.0.0.1", port }));
            const response = yield* Stream.make(encoder.encode("ping")).pipe(
                Stream.pipeThroughChannel(
                    FridaChannel.fromIOStream({
                        evaluate: () => connection,
                        onWriteError: (cause) => new WriteError({ cause }),
                        onReadError: (cause) => new ReadError({ cause }),
                    })
                ),
                Stream.runCollect
            );

            expect(response.map((chunk) => decoder.decode(chunk)).join("")).toBe("PING");
        })
    );
});
