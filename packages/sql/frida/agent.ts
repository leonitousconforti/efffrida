import { FileSystem } from "@effect/platform";
import { layer } from "@effect/platform-node/NodeFileSystem";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { FridaRuntime } from "@efffrida/platform";
import { layerProtocolFrida } from "@efffrida/rpc/FridaRpcServer";
import { FridaSqlClient } from "@efffrida/sql";
import { Effect, Layer } from "effect";
import { SqlRpcs } from "../shared/requests.js";
import { SqlLive } from "./handlers.js";

// Create the RPC server layer
const RpcLayer = RpcServer.layer(SqlRpcs).pipe(Layer.provide(SqlLive));

// Choose the protocol and serialization format
const NdJsonSerialization = RpcSerialization.layerNdjson;
const FridaProtocol = layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// Make a filesystem sql client layer
const SqlClientLayer = Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const tempDb = `${Process.getTmpDir()}/${Math.random() * 1000000}-efffrida-sql-test.db`;
    yield* Effect.addFinalizer(() => Effect.orDie(fileSystem.remove(tempDb)));
    return FridaSqlClient.layer({ filename: tempDb });
})
    .pipe(Effect.provide(layer))
    .pipe(Layer.unwrapScoped);

// Create the main rpc layer
const Main = RpcLayer.pipe(Layer.provide([FridaProtocol, SqlClientLayer]));

// Start the server
FridaRuntime.runMain(Layer.launch(Main));
