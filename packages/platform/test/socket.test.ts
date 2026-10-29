import type * as NetAddress from "effect/net/NetAddress";

import { Effect, Exit, Random, Schedule, Scope, Stream } from "effect";
import * as EffectSocket from "effect/socket/Socket";

import { describe, expect, it } from "@effect/vitest";
import * as FridaSocket from "@efffrida/platform/Socket";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const isCleanClose = (error: EffectSocket.SocketError): boolean =>
    error.reason._tag === "SocketCloseError" && error.reason.code === 1000;

const portOf = (address: NetAddress.SocketAddress): number => {
    if (address._tag === "UnixPathAddress") throw new Error("expected an inet address");
    return address.port;
};

// Echoes every chunk back until the peer closes the connection
const echo = (socket: EffectSocket.Socket) =>
    Effect.scoped(
        Effect.gen(function* () {
            const { pull } = yield* socket.reader;
            const writer = yield* socket.writer;
            while (true) yield* Effect.flatMap(pull, writer.writeAll);
        })
    ).pipe(Effect.catchIf(isCleanClose, () => Effect.void));

// Writes a message and reads until the same number of bytes came back
const roundtrip = (socket: EffectSocket.Socket, message: string) =>
    Effect.scoped(
        Effect.gen(function* () {
            const { pull } = yield* socket.reader;
            const writer = yield* socket.writer;
            yield* writer.write(message);
            let received = "";
            while (received.length < message.length) {
                for (const chunk of yield* pull) received += typeof chunk === "string" ? chunk : decoder.decode(chunk);
            }
            return received;
        })
    );

// Reads everything until the peer closes the connection
const readToEnd = (socket: EffectSocket.Socket) =>
    EffectSocket.toStream(socket).pipe(
        Stream.catchIf(isCleanClose, () => Stream.empty),
        Stream.runCollect,
        Effect.map((chunks) => chunks.map((chunk) => decoder.decode(chunk)).join(""))
    );

describe("socket tests", () => {
    it.effect("echoes through a SocketServer", () =>
        Effect.gen(function* () {
            const server = yield* FridaSocket.makeServer({ family: "ipv4", host: "127.0.0.1" });
            expect(server.address._tag).toBe("InetAddressV4");
            yield* Effect.forkScoped(server.run(echo));

            const port = portOf(server.address);
            const first = yield* FridaSocket.connect({ host: "127.0.0.1", port });
            const second = yield* FridaSocket.connect({ host: "127.0.0.1", port });
            const results = yield* Effect.all([roundtrip(first, "hello"), roundtrip(second, "world")], {
                concurrency: "unbounded",
            });
            expect(results).toEqual(["hello", "world"]);
        })
    );

    it.effect("reads until the peer writes a CloseEvent", () =>
        Effect.gen(function* () {
            const server = yield* FridaSocket.makeServer({ family: "ipv4", host: "127.0.0.1" });
            yield* Effect.forkScoped(
                server.run((socket) =>
                    Effect.scoped(
                        Effect.gen(function* () {
                            yield* socket.reader;
                            const writer = yield* socket.writer;
                            yield* writer.writeAll([encoder.encode("hello "), "world"]);
                            yield* writer.write(new EffectSocket.CloseEvent());
                        })
                    )
                )
            );

            const client = yield* FridaSocket.connect({ host: "127.0.0.1", port: portOf(server.address) });
            expect(yield* readToEnd(client)).toBe("hello world");
        })
    );

    it.live("fails a suspended pull when the reader scope closes", () =>
        Effect.gen(function* () {
            const server = yield* FridaSocket.makeServer({ family: "ipv4", host: "127.0.0.1" });
            yield* Effect.forkScoped(server.run(() => Effect.never));

            const client = yield* FridaSocket.connect({ host: "127.0.0.1", port: portOf(server.address) });
            const scope = yield* Scope.make();
            const { pull } = yield* Scope.provide(client.reader, scope);
            yield* Effect.forkScoped(Effect.andThen(Effect.sleep("20 millis"), Scope.close(scope, Exit.void)));
            const error = yield* Effect.flip(pull);
            expect(error.reason._tag).toBe("SocketCloseError");
        })
    );

    it.live("listen accepts a single connection", () =>
        Effect.gen(function* () {
            // Abstract UNIX sockets leave nothing behind on the filesystem
            const options = {
                family: "unix",
                type: "abstract",
                path: `efffrida-platform-${yield* Random.nextInt}`,
            } as const;
            const server = yield* FridaSocket.listen(options);
            yield* Effect.forkScoped(echo(server));

            // The listener is bound once the server side acquires its reader
            const client = yield* FridaSocket.connect(options);
            const result = yield* roundtrip(client, "single").pipe(
                Effect.retry({ times: 50, schedule: Schedule.spaced("10 millis") })
            );
            expect(result).toBe("single");
        })
    );
});
