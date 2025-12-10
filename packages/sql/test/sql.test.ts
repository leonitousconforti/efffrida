import { assert, describe, layer } from "@effect/vitest";

import { SqlClient } from "@effect/sql";
import { FridaSqlClient } from "@efffrida/sql";
import { Effect, Layer } from "effect";
import { unlinkSync } from "node:fs";

const TestLayer = Effect.gen(function* () {
    const tempDb = `${Process.getTmpDir()}/${Math.random() * 1000000}-efffrida-sql-test.db`;
    yield* Effect.addFinalizer(() => Effect.sync(() => unlinkSync(tempDb)));
    return FridaSqlClient.layer({ filename: tempDb });
})
    .pipe(Layer.unwrapScoped)
    .pipe(Layer.fresh);

describe("sql tests", () => {
    layer(TestLayer)((it) => {
        it.scoped("should work", () =>
            Effect.gen(function* () {
                const sql = yield* SqlClient.SqlClient;
                let response: ReadonlyArray<unknown>;
                response = yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
                assert.deepStrictEqual(response, []);
                response = yield* sql`INSERT INTO test (name) VALUES ('hello')`;
                assert.deepStrictEqual(response, []);
                response = yield* sql`SELECT * FROM test`;
                assert.deepStrictEqual(response, [[1, "hello"]]);
                response = yield* sql`INSERT INTO test (name) VALUES ('world')`.pipe(sql.withTransaction);
                assert.deepStrictEqual(response, []);
                response = yield* sql`SELECT * FROM test`;
                assert.deepStrictEqual(response, [
                    [1, "hello"],
                    [2, "world"],
                ]);
            })
        );
    });

    layer(TestLayer)((it) => {
        it.scoped("withTransaction", () =>
            Effect.gen(function* () {
                const sql = yield* SqlClient.SqlClient;
                yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
                yield* sql.withTransaction(sql`INSERT INTO test (name) VALUES ('hello')`);
                const rows = yield* sql<[number, string]>`SELECT * FROM test`;
                assert.deepStrictEqual(rows, [[1, "hello"]]);
            })
        );
    });

    layer(TestLayer)((it) => {
        it.scoped("withTransaction rollback", () =>
            Effect.gen(function* () {
                const sql = yield* SqlClient.SqlClient;
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
});
