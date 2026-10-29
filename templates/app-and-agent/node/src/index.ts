import { Effect, Layer } from "effect";
import { RpcClient, RpcSerialization } from "effect/rpc";

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

// Resolved through the "imports" field in package.json, so this points at the
// agent source whether the app runs from source (`pnpm start`) or from the
// build output in dist.
const ScriptLive = FridaScript.layer(new URL(import.meta.resolve("#frida-agent"))).pipe(
    Layer.provide(FridaSession.layer(["sleep", "infinity"])),
    Layer.provide(FridaDevice.layerLocalDevice),
    Layer.provideMerge(NodeServices.layer)
);

const MainLive = ProtocolLive.pipe(Layer.provide(ScriptLive));

// oxlint-disable-next-line effecttsgo/strict-effect-provide -- this is the entry point
NodeRuntime.runMain(Effect.scoped(Effect.provide(program, MainLive)));
