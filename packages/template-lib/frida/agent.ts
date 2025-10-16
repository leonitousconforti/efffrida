import { RpcSerialization, RpcServer } from "@effect/rpc";
import { FridaRuntime } from "@efffrida/platform";
import { layerProtocolFrida } from "@efffrida/rpc/FridaRpcServer";
import { Layer } from "effect";
import { UserRpcs } from "../shared/requests.js";
import { UsersLive } from "./handlers.js";

// Create the RPC server layer
const RpcLayer = RpcServer.layer(UserRpcs).pipe(Layer.provide(UsersLive));

// Choose the protocol and serialization format
const NdJsonSerialization = RpcSerialization.layerNdjson;
const FridaProtocol = layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// Create the main rpc layer
const Main = RpcLayer.pipe(Layer.provide(FridaProtocol));

// Start the server
FridaRuntime.runMain(Layer.launch(Main));
