import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import * as FridaRuntime from "@efffrida/platform/FridaRuntime";
import { FridaRpcServer } from "@efffrida/rpc/frida";

import { AgentRpcs } from "@<SCOPE>/shared";

const AgentRpcsLive = AgentRpcs.toLayer(
    Effect.gen(function* () {
        return {
            Ping: () => Effect.succeed("pong"),
            Echo: ({ message }: { message: string }) => Effect.succeed(message),
        };
    })
);

const ProtocolLive = FridaRpcServer.layerProtocolFrida().pipe(
    Layer.provide(RpcSerialization.layerNdjson)
);

const Main = RpcServer.layer(AgentRpcs).pipe(
    Layer.provide(AgentRpcsLive),
    Layer.provide(ProtocolLive)
);

FridaRuntime.runMain(Layer.launch(Main));
