// import { RpcSerialization, RpcServer } from "@effect/rpc";
// import { FridaRpcServer } from "@efffrida/rpc";
// import { Effect, Layer } from "effect";
// import { UserRpcs } from "../shared/requests.js";
// import { UsersLive } from "./handlers.js";

// // Create the RPC server layer
// const RpcLayer = RpcServer.layer(UserRpcs).pipe(Layer.provide(UsersLive));

// // Choose the protocol and serialization format
// const NdJsonSerialization = RpcSerialization.layerNdjson;
// const FridaProtocol = FridaRpcServer.layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// // Create the main rpc layer
// const Main = RpcLayer.pipe(Layer.provide(FridaProtocol));

// // Start the server
// Effect.runFork(Layer.launch(Main));

// (() => {
//     rpc.exports["rpc"] = Function.identity;
// })();

send("here1");

// Effect.runSync(
//     Effect.sync(() => {
//         send("here2");
//         rpc.exports["rpc"] = Function.identity;
//     })
// );
