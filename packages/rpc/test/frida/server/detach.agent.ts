import "@efffrida/polyfills";

import { Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/rpc";

import { FridaRuntime } from "@efffrida/platform";
import { FridaRpcServer } from "@efffrida/rpc/frida";

import { DetachLive } from "../../shared/handlers.ts";
import { DetachRpcs } from "../../shared/requests.ts";

const RpcLayer = RpcServer.layer(DetachRpcs).pipe(Layer.provide(DetachLive));
const FridaProtocol = FridaRpcServer.layerProtocolFrida().pipe(Layer.provide(RpcSerialization.layerNdjson));

FridaRuntime.runMain(Layer.launch(RpcLayer.pipe(Layer.provide(FridaProtocol))));
