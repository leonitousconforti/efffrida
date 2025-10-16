import { expect, layer } from "@effect/vitest";

import { Path } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc";
import { Chunk, Effect, Layer, Option, Stream } from "effect";
import { UserRpcs } from "../shared/requests.js";

// Choose which serialization to use
const NdJsonSerialization = RpcSerialization.layerNdjson;

// Choose which protocol to use
const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide([NdJsonSerialization]));

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive);
const ScriptLive = FridaScript.layer(new URL("../frida/agent.ts", import.meta.url))
    .pipe(Layer.provideMerge(FridaLive))
    .pipe(Layer.provide(Path.layer));

// Now we have an rpc client layer with no dependencies
const Live = Layer.provide(ProtocolLive, ScriptLive);

// Use the client
layer(Live)("Should be able to perform rpc communication", (it) => {
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
