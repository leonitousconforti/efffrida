import * as A from "effect/Effect";

console.log(A);

// import { FridaRpcServer } from "@efffrida/rpc";
// import { UserRpcs } from "../shared/requests.js";
// import { UsersLive } from "./handlers.js";

// Create the RPC server layer
// const RpcLayer = RpcServer.layer(UserRpcs).pipe(Layer.provide(UsersLive));

// // Choose the protocol and serialization format
// const NdJsonSerialization = RpcSerialization.layerNdjson;
// const FridaProtocol = FridaRpcServer.layerProtocolFrida({ onRpcAvailable: "here" }).pipe(
//     Layer.provide(NdJsonSerialization)
// );

// // Create the main rpc layer
// const Main = RpcLayer.pipe(Layer.provide(FridaProtocol));

// // Start the server
// Effect.runFork(Layer.launch(Main));

send("here");
