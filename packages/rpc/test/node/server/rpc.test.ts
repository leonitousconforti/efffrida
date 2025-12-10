import { RpcSerialization, RpcServer } from "@effect/rpc";
import { FridaRuntime } from "@efffrida/platform";
import { FridaRpcServer } from "@efffrida/rpc/frida";
import { Layer } from "effect";

import { UsersLive } from "../../shared/handlers.ts";
import { UserRpcs } from "../../shared/requests.ts";

// Create the RPC server layer
const RpcLayer = RpcServer.layer(UserRpcs).pipe(Layer.provide(UsersLive));

// Choose the protocol and serialization format
const NdJsonSerialization = RpcSerialization.layerNdjson;
const FridaProtocol = FridaRpcServer.layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// Create the main rpc layer
const Main = RpcLayer.pipe(Layer.provide(FridaProtocol));

// Start the server
FridaRuntime.runMain(Layer.launch(Main));
