import { expect, layer } from "@effect/vitest";

import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc/node";
import { Chunk, Effect, Layer, Option, Stream } from "effect";
import { UserRpcs } from "../../shared/requests.ts";

// Choose which serialization to use
const NdJsonSerialization = RpcSerialization.layerNdjson;

// Choose which protocol to use
const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide([NdJsonSerialization]));

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "INFINITY");
        const process = yield* executor.start(command);
        const pid = process.pid;
        return FridaSession.layer(pid);
    })
);

const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));

// Now we have an rpc client layer with no dependencies
const ScriptLive = FridaScript.layer(new URL("../frida/agent.ts", import.meta.url));
const Live = Layer.provide(ProtocolLive, ScriptLive);

// Use the client
layer(FridaLive)("local device tests", (it) => {
    it.layer(Live)("Should be able to perform rpc communication", (it) => {
        it.scoped("demo from rpc readme", () =>
            Effect.gen(function* () {
                const client = yield* RpcClient.make(UserRpcs);
                const user = yield* client.UserById({ id: "1" });
                expect(user).toEqual({ id: "1", name: "Alice" });
                let users = yield* Stream.runCollect(client.UserList());
                expect(users).toEqual(Chunk.make({ id: "1", name: "Alice" }, { id: "2", name: "Bob" }));
                if (Option.isNone(Chunk.findFirst(users, (user) => user.id === "3"))) {
                    yield* client.UserCreate({ name: "Charlie" });
                    users = yield* Stream.runCollect(client.UserList());
                }
                expect(users).toEqual(
                    Chunk.make(
                        {
                            id: "1",
                            name: "Alice",
                        },
                        {
                            id: "2",
                            name: "Bob",
                        },
                        {
                            id: "3",
                            name: "Charlie",
                        }
                    )
                );
            })
        );
    });
});
