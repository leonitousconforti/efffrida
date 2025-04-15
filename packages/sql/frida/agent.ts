import { Reactivity } from "@effect/experimental";
import { FileSystem } from "@effect/platform";
import { layer } from "@effect/platform-node/NodeFileSystem";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { SqlClient } from "@effect/sql";
import { layerProtocolFrida } from "@efffrida/rpc/FridaRpcServer";
import { Effect, Layer } from "effect";
import { SqlRpcs } from "../shared/requests.js";
import { FridaSqlClient } from "../src/index.js";
import { SqlLive } from "./handlers.js";

// Make a filesystem sql client
const makeFilesystemClient = Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const dir = yield* fs.makeTempDirectoryScoped();
    return yield* FridaSqlClient.make({ filename: dir + "/test.db" });
}).pipe(Effect.provide([Reactivity.layer, layer]));

// Create the RPC server layer
const RpcLayer = RpcServer.layer(SqlRpcs).pipe(Layer.provide(SqlLive));

// Choose the protocol and serialization format
const NdJsonSerialization = RpcSerialization.layerNdjson;
const FridaProtocol = layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// Create the sql client layer
const SqlClientLayer = Layer.scoped(SqlClient.SqlClient, makeFilesystemClient);

// Create the main rpc layer
const Main = RpcLayer.pipe(Layer.provide([FridaProtocol, SqlClientLayer]));

// Start the server
Effect.runFork(Layer.launch(Main));
