import { describe, expect, it } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc";
import { Chunk, Effect, Layer, Option, Stream } from "effect";
import { ScriptRuntime } from "frida";
import { SqlRpcs } from "../shared/requests.js";

// Choose which serialization to use
const NdJsonSerialization = RpcSerialization.layerNdjson;

// Choose which protocol to use
const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide([NdJsonSerialization]));

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive);

// Compile the agent
const ScriptLive = FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url))
    .pipe(Effect.map(FridaScript.layer({ runtime: ScriptRuntime.V8 })))
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide([FridaLive, NodeContext.layer]));

// Now we have an rpc client layer with no dependencies
const Live = Layer.provide(ProtocolLive, ScriptLive);

// Use the client
describe("Should be able to perform rpc communication", () => {
    it.scoped("demo from rpc readme", () =>
        Effect.gen(function* () {
            const client = yield * RpcClient.make(SqlRpcs);
            const user = yield* client.UserById({ id: "1" });
            expect(user).toEqual({ id: "1", name: "Alice" });
            let users = yield* Stream.runCollect(client.UserList());
            expect(users).toEqual(Chunk.make({ id: "1", name: "Alice" }, { id: "2", name: "Bob" }));
            if (Option.isNone(Chunk.findFirst(users, (user) => user.id === "3"))) {
                yield* client.UserCreate({ name: "Charlie" });
                users = yield* Stream.runCollect(client.UserList());
            }
            expect(users).toEqual(
                Chunk.make({ id: "1", name: "Alice" }, { id: "2", name: "Bob" }, { id: "3", name: "Charlie" })
            );
        }).pipe(Effect.provide(Live))
    );
});

describe("Client", () => {
    it.scoped("should work", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            let response;
            response = yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
            assert.deepStrictEqual(response, []);
            response = yield* sql`INSERT INTO test (name) VALUES ('hello')`;
            assert.deepStrictEqual(response, []);
            response = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(response, [{ id: 1, name: "hello" }]);
            response = yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('world')`);
            assert.deepStrictEqual(response, []);
            response = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(response, [
                { id: 1, name: "hello" },
                { id: 2, name: "world" },
            ]);
        })
    );

    it.scoped("should work with raw", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            let response;
            response = yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`.raw;
            assert.deepStrictEqual(response, { changes: 0, lastInsertRowid: 0 });
            response = yield* sql`INSERT INTO test (name) VALUES ('hello')`.raw;
            assert.deepStrictEqual(response, { changes: 1, lastInsertRowid: 1 });
            response = yield* sql`SELECT * FROM test`.raw;
            assert.deepStrictEqual(response, [{ id: 1, name: "hello" }]);
            response = yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('world')`.raw);
            assert.deepStrictEqual(response, { changes: 1, lastInsertRowid: 2 });
            response = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(response, [
                { id: 1, name: "hello" },
                { id: 2, name: "world" },
            ]);
        })
    );

    it.scoped("withTransaction", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
            yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('hello')`);
            const rows = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(rows, [{ id: 1, name: "hello" }]);
        })
    );

    it.scoped("withTransaction rollback", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
            yield* sql`INSERT INTO test (name) VALUES ('hello')`.pipe(
                Effect.andThen(Effect.fail("boom")),
                sql.withTransaction,
                Effect.ignore
            );
            const rows = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(rows, []);
        })
    );
});
