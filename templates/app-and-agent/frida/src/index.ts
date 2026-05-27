import { Effect, Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { FridaRuntime } from "@efffrida/platform";
import { FridaRpcServer } from "@efffrida/rpc/frida";

import { AgentRpcs } from "../../shared/index.ts";

// Implement the RPC handlers
const AgentRpcsLive = AgentRpcs.toLayer(
    Effect.gen(function* () {
        return {
            Ping: () => Effect.succeed("pong"),
            Echo: ({ message }: { message: string }) => Effect.succeed(message),
        };
    })
);

// Create the RPC server layer
const RpcLayer = RpcServer.layer(AgentRpcs).pipe(Layer.provide(AgentRpcsLive));

// Choose the protocol and serialization format
const ProtocolLive = FridaRpcServer.layerProtocolFrida().pipe(Layer.provide(RpcSerialization.layerNdjson));

// Create the main rpc layer
const Main = RpcLayer.pipe(Layer.provide(ProtocolLive));

// Start the server
FridaRuntime.runMain(Layer.launch(Main));
