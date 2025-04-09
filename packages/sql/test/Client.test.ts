import { Reactivity } from "@effect/experimental";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { FridaSqlClient } from "@efffrida/sql";
import { Effect } from "effect";

const makeFilesystemClient = Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const dir = yield* fs.makeTempDirectoryScoped();
    return yield* FridaSqlClient.make({ filename: dir + "/test.db" });
})
    .pipe(Effect.provide(Reactivity.layer))
    .pipe(Effect.provide(NodeFileSystem.layer));

describe("Client", () => {
    it.scoped("should work", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            let response;
            response = yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
            assert.deepStrictEqual(response, []);
            response = yield* sql`INSERT INTO test (name) VALUES ('hello')`;
            assert.deepStrictEqual(response, []);
            response = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(response, [{ id: 1, name: "hello" }]);
            response = yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('world')`);
            assert.deepStrictEqual(response, []);
            response = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(response, [
                { id: 1, name: "hello" },
                { id: 2, name: "world" },
            ]);
        })
    );

    it.scoped("should work with raw", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            let response;
            response = yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`.raw;
            assert.deepStrictEqual(response, { changes: 0, lastInsertRowid: 0 });
            response = yield* sql`INSERT INTO test (name) VALUES ('hello')`.raw;
            assert.deepStrictEqual(response, { changes: 1, lastInsertRowid: 1 });
            response = yield* sql`SELECT * FROM test`.raw;
            assert.deepStrictEqual(response, [{ id: 1, name: "hello" }]);
            response = yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('world')`.raw);
            assert.deepStrictEqual(response, { changes: 1, lastInsertRowid: 2 });
            response = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(response, [
                { id: 1, name: "hello" },
                { id: 2, name: "world" },
            ]);
        })
    );

    it.scoped("withTransaction", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
            yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('hello')`);
            const rows = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(rows, [{ id: 1, name: "hello" }]);
        })
    );

    it.scoped("withTransaction rollback", () =>
        Effect.gen(function* () {
            const sql = yield* makeFilesystemClient;
            yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
            yield* sql`INSERT INTO test (name) VALUES ('hello')`.pipe(
                Effect.andThen(Effect.fail("boom")),
                sql.withTransaction,
                Effect.ignore
            );
            const rows = yield* sql`SELECT * FROM test`;
            assert.deepStrictEqual(rows, []);
        })
    );
});
