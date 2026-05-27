import { Effect, Layer } from "effect";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc/node";

import { AgentRpcs } from "../../shared/index.ts";

const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(AgentRpcs);
    const pong = yield* client.Ping();
    yield* Effect.log(`Ping: ${pong}`);
    const echo = yield* client.Echo({ message: "Hello from app!" });
    yield* Effect.log(`Echo: ${echo}`);
});

const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide(RpcSerialization.layerNdjson));

const ScriptLive = FridaScript.layer(new URL("../../frida/src/index.ts", import.meta.url)).pipe(
    Layer.provide(FridaSession.layer(["sleep", "infinity"])),
    Layer.provide(FridaDevice.layerLocalDevice),
    Layer.provideMerge(NodeServices.layer)
);

const MainLive = ProtocolLive.pipe(Layer.provide(ScriptLive));

NodeRuntime.runMain(Effect.scoped(Effect.provide(program, MainLive)));
