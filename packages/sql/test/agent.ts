import { FileSystem } from "@effect/platform";
import { layer } from "@effect/platform-node/NodeFileSystem";
import { FridaSqlClient } from "@efffrida/sql";
import { Effect, Layer } from "effect";

// Make a filesystem sql client layer
export const SqlClientLayer = Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const tempDb = `${Process.getTmpDir()}/${Math.random() * 1000000}-efffrida-sql-test.db`;
    yield* Effect.addFinalizer(() => Effect.orDie(fileSystem.remove(tempDb)));
    return FridaSqlClient.layer({ filename: tempDb });
})
    .pipe(Effect.provide(layer))
    .pipe(Layer.unwrapScoped);
