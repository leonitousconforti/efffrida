import { describe, it } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { RpcSerialization } from "@effect/rpc";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc";
import { Effect, Layer, Option, Stream } from "effect";

// Choose which protocol to use
const NdJsonSerialization = RpcSerialization.layerNdjson;
const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide([NdJsonSerialization]));

// Pick a device and a session/program
const LocalDeviceLive = Layer.provideMerge(FridaSession.layer("/usr/bin/sleep"), FridaDevice.layerLocalDevice);

// Compile the agent
const ScriptLive = Effect.map(
    FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url)),
    FridaScript.layer
)
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide(LocalDeviceLive))
    .pipe(Layer.provide(NodeContext.layer));

// Now we have an rpc client layer with no dependencies
// const RpcLive = Layer.provideMerge(ProtocolLive, ScriptLive);

// Use the client
describe("Should be able to perform rpc communication", () => {
    it.scopedLive("rpc test", () =>
        Effect.gen(function* () {
            const script = yield* Effect.flatMap(
                FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url)),
                FridaScript.load
            );

            const message = yield* script.stream.pipe(Stream.runHead).pipe(Effect.map(Option.getOrThrow));
            console.log("message", message);

            // const a = yield* Effect.promise(() => script.exports["rpc"]("a"));
            // expect(a).toEqual("a");
            // const client = yield* RpcClient.make(UserRpcs);
            // yield* Effect.sleep("1 second");
            // const user = yield* client.UserById({ id: "1" });
            // console.log("User: ", user);
            // let users = yield* Stream.runCollect(client.UserList({}));
            // if (!Chunk.findFirst(users, (user) => user.id === "3")) {
            //     console.log(`Creating user "Charlie"`);
            //     yield* client.UserCreate({ name: "Charlie" });
            //     users = yield* Stream.runCollect(client.UserList({}));
            // } else {
            //     console.log(`User "Charlie" already exists`);
            // }
            // yield* Console.log("Users: ", users);
        })
            .pipe(Effect.provide(LocalDeviceLive))
            .pipe(Effect.provide(NodeContext.layer))
    );
});
