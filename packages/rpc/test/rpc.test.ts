import { describe, it } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc";
import { Chunk, Console, Effect, Layer, Stream } from "effect";
import { ScriptRuntime } from "frida";
import { UserRpcs } from "../shared/requests.js";

// Choose which protocol to use
const NdJsonSerialization = RpcSerialization.layerNdjson;
const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide([NdJsonSerialization]));

// Pick a device and a session/program
const LocalDeviceLive = Layer.provideMerge(FridaSession.layer("/usr/bin/sleep"), FridaDevice.layerLocalDevice);

// Compile the agent
const ScriptLive = FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url))
    .pipe(Effect.map(FridaScript.layer({ runtime: ScriptRuntime.V8 })))
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide(LocalDeviceLive))
    .pipe(Layer.provide(NodeContext.layer));

// Now we have an rpc client layer with no dependencies
const RpcLive = Layer.provideMerge(ProtocolLive, ScriptLive);

// Use the client
describe("Should be able to perform rpc communication", () => {
    it.effect("demo from rpc readme", () =>
        Effect.gen(function* () {
            const client = yield* RpcClient.make(UserRpcs);
            const user = yield* client.UserById({ id: "1" });
            yield* Console.log("User: ", user);
            let users = yield* Stream.runCollect(client.UserList({}));
            if (!Chunk.findFirst(users, (user) => user.id === "3")) {
                yield* Console.log(`Creating user "Charlie"`);
                yield* client.UserCreate({ name: "Charlie" });
                users = yield* Stream.runCollect(client.UserList({}));
            } else {
                yield* Console.log(`User "Charlie" already exists`);
            }
            yield* Console.log("Users: ", users);
        })
            .pipe(Effect.scoped)
            .pipe(Effect.provide(RpcLive))
            .pipe(Effect.provide(LocalDeviceLive))
            .pipe(Effect.provide(NodeContext.layer))
    );
});
