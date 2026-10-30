import { Array as Arr, Effect, Exit, Layer, Stream } from "effect";
import { SqlClient } from "effect/sql";

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
                assert.deepStrictEqual(response, [{ id: 1, name: "hello" }]);
                response = yield* sql`INSERT INTO test (name) VALUES ('world')`.pipe(sql.withTransaction);
                assert.deepStrictEqual(response, []);
                response = yield* sql`SELECT * FROM test`;
                assert.deepStrictEqual(response, [
                    { id: 1, name: "hello" },
                    { id: 2, name: "world" },
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
                const rows = yield* sql<{ id: number; name: string }>`SELECT * FROM test`;
                assert.deepStrictEqual(rows, [{ id: 1, name: "hello" }]);
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

    layer(TestLayer)((it) => {
        it.effect("stream", () =>
            Effect.gen(function* () {
                const sql = yield* SqlClient.SqlClient;
                yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
                const names = Arr.makeBy(300, (i) => ({ name: `name-${i}` }));
                yield* sql`INSERT INTO test ${sql.insert(names)}`;

                const rows = yield* Stream.runCollect(
                    sql<{ id: number; name: string }>`SELECT * FROM test WHERE id > ${10} ORDER BY id`.stream
                );
                assert.strictEqual(rows.length, 290);
                assert.deepStrictEqual(rows[0], { id: 11, name: "name-10" });
                assert.deepStrictEqual(rows[289], { id: 300, name: "name-299" });

                const empty = yield* Stream.runCollect(sql`SELECT * FROM test WHERE id < ${0}`.stream);
                assert.deepStrictEqual(empty, []);

                // Stopping early releases the statement and the connection
                const first = yield* Stream.runCollect(Stream.take(sql`SELECT * FROM test ORDER BY id`.stream, 2));
                assert.deepStrictEqual(first, [
                    { id: 1, name: "name-0" },
                    { id: 2, name: "name-1" },
                ]);
                yield* sql`DROP TABLE test`;
            })
        );
    });

    layer(TestLayer)((it) => {
        it.effect("failed prepares are not cached", () =>
            Effect.gen(function* () {
                const sql = yield* SqlClient.SqlClient;
                const before = yield* Effect.exit(sql`SELECT * FROM test`);
                assert.isTrue(Exit.isFailure(before));
                yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
                const after = yield* sql`SELECT * FROM test`;
                assert.deepStrictEqual(after, []);
            })
        );
    });

    layer(TestLayer)((it) => {
        it.effect("bigint params", () =>
            Effect.gen(function* () {
                const sql = yield* SqlClient.SqlClient;
                yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`;
                // Every 64 bit integer is bound losslessly, even past Number.MAX_SAFE_INTEGER
                const large = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
                yield* sql`INSERT INTO test (id, name) VALUES (${large}, 'large')`;
                // Read back as text, since Frida returns integer columns as numbers
                const rows = yield* sql<{ id: string }>`SELECT CAST(id AS TEXT) AS id FROM test`;
                assert.strictEqual(rows[0].id, large.toString());
                // Outside of SQLite's 64 bit range it fails instead of losing precision
                const exit = yield* Effect.exit(sql`INSERT INTO test (id, name) VALUES (${2n ** 63n}, 'too large')`);
                assert.isTrue(Exit.isFailure(exit));
            })
        );
    });
});
