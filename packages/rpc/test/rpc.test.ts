import { describe, expect, it } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc";
import { Chunk, Console, Effect, Layer, Option, Stream } from "effect";
import { ScriptRuntime } from "frida";
import { UserRpcs } from "../shared/requests.js";

// Choose which serialization to use
const NdJsonSerialization = RpcSerialization.layerNdjson;

// Choose which protocol to use
const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide([NdJsonSerialization]));

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");

// Compile the agent
const ScriptLive = FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url))
    .pipe(Effect.map(FridaScript.layer({ runtime: ScriptRuntime.V8 })))
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide([Layer.provideMerge(SessionLive, DeviceLive), NodeContext.layer]));

// Now we have an rpc client layer with no dependencies
const Live = Layer.provide(ProtocolLive, ScriptLive);

// Use the client
describe("Should be able to perform rpc communication", () => {
    it.scoped("demo from rpc readme", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(UserRpcs);
            const user = yield* client.UserById({ id: "1" });
            expect(user).toEqual({ id: "1", name: "Alice" });
            // yield* Console.log("User: ", user);
            let users = yield* Stream.runCollect(client.UserList());
            // yield* Console.log("Users: ", users);
            if (Option.isNone(Chunk.findFirst(users, (user) => user.id === "3"))) {
                // yield* Console.log(`Creating user "Charlie"`);
                yield* client.UserCreate({ name: "Charlie" });
                users = yield* Stream.runCollect(client.UserList({}));
            } else {
                yield* Console.log(`User "Charlie" already exists`);
            }
            // yield* Console.log("Users: ", users);
            expect(users).toEqual(
                Chunk.make({ id: "1", name: "Alice" }, { id: "2", name: "Bob" }, { id: "3", name: "Charlie" })
            );
        }).pipe(Effect.provide(Live))
    );
});
