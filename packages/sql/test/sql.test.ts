import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { unlinkSync } from "node:fs";

import { assert, describe, layer } from "@effect/vitest";
import { FridaSqlClient } from "@efffrida/sql";

const TestLayer = Effect.gen(function* () {
    const tempDb = `${Process.getTmpDir()}/${Math.random() * 1000000}-efffrida-sql-test.db`;
    yield* Effect.addFinalizer(() => Effect.sync(() => unlinkSync(tempDb)));
    return FridaSqlClient.layer({ filename: tempDb });
}).pipe(Layer.unwrap, Layer.fresh);

describe("sql tests", () => {
    layer(TestLayer)((it) => {
        it.effect("should work", () =>
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
        it.effect("withTransaction", () =>
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
        it.effect("withTransaction rollback", () =>
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
