import { expect, layer } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc";
import { Effect, Layer } from "effect";
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
    .pipe(Effect.map(FridaScript.layer()))
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide([FridaLive, NodeContext.layer]));

// Now we have an rpc client layer with no dependencies
const Live = Layer.provide(ProtocolLive, ScriptLive);

layer(Live)("Client", (it) => {
    it.scoped("should work", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(SqlRpcs);
            const request = (statement: string) => client.sql({ statement });
            let response;
            response = yield* request("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
            expect(response).toStrictEqual([]);
            response = yield* request("INSERT INTO test (name) VALUES ('hello')");
            expect(response).toStrictEqual([]);
            response = yield* request("SELECT * FROM test");
            expect(response).toStrictEqual([{ id: 1, name: "hello" }]);
            response = yield* request("INSERT INTO test (name) VALUES ('world')");
            expect(response).toStrictEqual([]);
            response = yield* request("SELECT * FROM test");
            expect(response).toStrictEqual([
                { id: 1, name: "hello" },
                { id: 2, name: "world" },
            ]);
        })
    );

    it.scoped("should work with raw", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(SqlRpcs);
            const request = (statement: string) => client.raw({ statement });
            let response;
            response = yield* request("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
            expect(response).toStrictEqual({ changes: 0, lastInsertRowid: 0 });
            response = yield* request("INSERT INTO test (name) VALUES ('hello')");
            expect(response).toStrictEqual({ changes: 1, lastInsertRowid: 1 });
            response = yield* request("SELECT * FROM test");
            expect(response).toStrictEqual([{ id: 1, name: "hello" }]);
            response = yield* request("INSERT INTO test (name) VALUES ('world')");
            expect(response).toStrictEqual({ changes: 1, lastInsertRowid: 2 });
            response = yield* request("SELECT * FROM test");
            expect(response).toStrictEqual([
                { id: 1, name: "hello" },
                { id: 2, name: "world" },
            ]);
        })
    );

    it.scoped("withTransaction", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(SqlRpcs);
            yield* client.sql({ statement: "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)" });
            yield* client.transaction({ statement: "INSERT INTO test (name) VALUES ('hello')" });
            const rows = yield* client.sql({ statement: "SELECT * FROM test" });
            expect(rows).toStrictEqual([{ id: 1, name: "hello" }]);
        })
    );

    it.scoped("withTransaction rollback", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(SqlRpcs);
            yield* client.sql({ statement: "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)" });
            yield* client.transactionRollback({ statement: "INSERT INTO test (name) VALUES ('hello')" });
            const rows = yield* client.sql({ statement: "SELECT * FROM test" });
            expect(rows).toStrictEqual([]);
        })
    );
});
