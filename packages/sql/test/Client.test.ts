import { describe, expect, it } from "@effect/vitest";

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

describe("Client", () => {
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
            expect(response).toStrictEqual([[1, "hello"]]);
            response = yield* request("INSERT INTO test (name) VALUES ('world')");
            expect(response).toStrictEqual([]);
            response = yield* request("SELECT * FROM test");
            expect(response).toStrictEqual([
                [1, "hello"],
                [2, "world"],
            ]);
        }).pipe(Effect.provide(Live))
    );

    it.scoped("withTransaction", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(SqlRpcs);
            yield* client.sql({ statement: "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)" });
            yield* client.transaction({ statement: "INSERT INTO test (name) VALUES ('hello')" });
            const rows = yield* client.sql({ statement: "SELECT * FROM test" });
            expect(rows).toStrictEqual([[1, "hello"]]);
        }).pipe(Effect.provide(Live))
    );

    it.scoped("withTransaction rollback", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(SqlRpcs);
            yield* client.sql({ statement: "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)" });
            yield* client.transactionRollback({ statement: "INSERT INTO test (name) VALUES ('hello')" });
            const rows = yield* client.sql({ statement: "SELECT * FROM test" });
            expect(rows).toStrictEqual([]);
        }).pipe(Effect.provide(Live))
    );
});
