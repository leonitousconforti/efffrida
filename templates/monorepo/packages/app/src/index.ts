import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
import { FridaRpcClient } from "@efffrida/rpc/node";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

import { AgentRpcs } from "@<SCOPE>/shared";

const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(AgentRpcs);
    const pong = yield* client.Ping();
    yield* Effect.log(`Ping: ${pong}`);
    const echo = yield* client.Echo({ message: "Hello from app!" });
    yield* Effect.log(`Echo: ${echo}`);
});

const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(
    Layer.provide(RpcSerialization.layerNdjson)
);

const ScriptLive = FridaScript.layer(
    new URL("../../agent/src/index.ts", import.meta.url)
).pipe(
    Layer.provide(FridaSession.layer(["sleep", "infinity"])),
    Layer.provide(FridaDevice.layerLocalDevice),
    Layer.provideMerge(NodeServices.layer)
);

const MainLive = ProtocolLive.pipe(Layer.provide(ScriptLive));

NodeRuntime.runMain(Effect.provide(program, MainLive));
