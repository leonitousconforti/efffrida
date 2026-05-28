import { Effect, Layer } from "effect";
import { ChildProcess } from "effect/unstable/process";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { NodeServices } from "@effect/platform-node";
import { expect, layer } from "@effect/vitest";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcServer } from "@efffrida/rpc/node";
import { JsPlatform } from "frida";

import { UsersLive } from "../../shared/handlers.ts";
import { UserRpcs, CallbackRpcs, type User } from "../../shared/requests.ts";

const results = [] as Array<User | ReadonlyArray<User>>;

const callbacks = CallbackRpcs.toLayer(
    Effect.gen(function* () {
        return {
            Callback: (user) => {
                results.push(user);
                return Effect.void;
            },
        };
    })
);

// Create the RPC server layer
const RpcLayer = RpcServer.layer(UserRpcs.merge(CallbackRpcs)).pipe(Layer.provide(UsersLive), Layer.provide(callbacks));

// Choose which serialization to use
const NdJsonSerialization = RpcSerialization.layerNdjson;

// Choose which protocol to use
const ProtocolLive = FridaRpcServer.layerProtocolFrida.pipe(Layer.provide(NdJsonSerialization));

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive =
    process.env.CI !== undefined
        ? FridaSession.layer(["/usr/bin/sleep", "infinity"])
        : Layer.unwrap(
              Effect.gen(function* () {
                  const handle = yield* ChildProcess.make("sleep", ["infinity"]);
                  return FridaSession.layer(handle.pid);
              })
          ).pipe(Layer.provide(NodeServices.layer));

const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeServices.layer));
const ScriptLive = FridaScript.layer(new URL("../../frida/client/agent.ts", import.meta.url), {
    platform: JsPlatform.Browser,
}).pipe(Layer.provide(FridaLive));

const Live = ProtocolLive.pipe(Layer.provide(ScriptLive));
const Main = RpcLayer.pipe(Layer.provide(Live));

// Let the client use the server
layer(Main, { excludeTestServices: true })("Should be able to perform rpc communication", (it) => {
    it.effect("demo from rpc readme", () =>
        Effect.gen(function* () {
            yield* Effect.whileLoop({
                while: () => results.length !== 3,
                body: () => Effect.sleep("100 millis"),
                step: () => {},
            });

            expect(results).toEqual([
                { id: "1", name: "Alice" },
                [
                    { id: "1", name: "Alice" },
                    { id: "2", name: "Bob" },
                ],
                [
                    { id: "1", name: "Alice" },
                    { id: "2", name: "Bob" },
                    { id: "3", name: "Charlie" },
                ],
            ]);
        })
    );
});
