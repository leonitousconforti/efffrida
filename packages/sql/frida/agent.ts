import { RpcSerialization, RpcServer } from "@effect/rpc";
import { FridaRuntime } from "@efffrida/platform";
import { layerProtocolFrida } from "@efffrida/rpc/FridaRpcServer";
import { Layer } from "effect";
import { SqlRpcs } from "../shared/requests.js";
import { FridaSqlClient } from "../src/index.js";
import { SqlLive } from "./handlers.js";

// Make a filesystem sql client
const SqlClientLayer = FridaSqlClient.layer({ filename: "/test.db" });

// Create the RPC server layer
const RpcLayer = RpcServer.layer(SqlRpcs).pipe(Layer.provide(SqlLive));

// Choose the protocol and serialization format
const NdJsonSerialization = RpcSerialization.layerNdjson;
const FridaProtocol = layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// Create the main rpc layer
const Main = RpcLayer.pipe(Layer.provide([FridaProtocol, SqlClientLayer]));

// Start the server
FridaRuntime.runMain(Layer.launch(Main));
