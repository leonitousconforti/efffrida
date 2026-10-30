/**
 * Frida sql client for effect-ts.
 *
 * @since 1.0.0
 */

import type * as Pull from "effect/Pull";
import type * as Scope from "effect/Scope";
import type * as SqlConnection from "effect/sql/SqlConnection";

import * as Array from "effect/Array";
import * as Cache from "effect/Cache";
import * as Cause from "effect/Cause";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Reactivity from "effect/reactivity/Reactivity";
import * as Semaphore from "effect/Semaphore";
import * as SqlClient from "effect/sql/SqlClient";
import * as SqlError from "effect/sql/SqlError";
import * as Statement from "effect/sql/Statement";
import * as Stream from "effect/Stream";

/** @internal */
const ATTR_DB_SYSTEM_NAME = "db.system.name";

/** @internal */
const STREAM_CHUNK_SIZE = 128;

/** @internal */
const classifyError = (cause: unknown, message: string, operation: string) =>
    SqlError.classifySqliteError(cause, { message, operation });

/**
 * @since 1.0.0
 * @category Type ids
 */
export const TypeId: TypeId = "~@efffrida/sql/SqliteClient";

/**
 * @since 1.0.0
 * @category Type ids
 */
export type TypeId = "~@efffrida/sql/SqliteClient";

/**
 * @since 1.0.0
 * @category Models
 */
export interface SqliteClient extends SqlClient.SqlClient {
    readonly [TypeId]: TypeId;
    readonly config: SqliteClientConfig;

    /**
     * Dump the database to a gzip-compressed blob encoded as Base64, where the
     * result is returned as a string. This is useful for inlining a cache in
     * your agent’s code, loaded by calling SqliteDatabase.openInline().
     */
    readonly dump: Effect.Effect<string, SqlError.SqlError>;

    /** Not supported in sqlite */
    readonly updateValues: never;
}

/**
 * @since 1.0.0
 * @category Services
 */
export const SqliteClient = Context.Service<SqliteClient>("@efffrida/sql/SqliteClient");

/**
 * @since 1.0.0
 * @category Models
 */
export type SqliteClientConfig = (
    | { readonly inlineData: string }
    | { readonly filename: string; readonly openFlags?: Array<SqliteOpenFlag> | undefined }
) & {
    readonly disableWAL?: boolean | undefined;
    readonly prepareCacheSize?: number | undefined;
    readonly prepareCacheTTL?: Duration.Input | undefined;
    readonly spanAttributes?: Record<string, unknown> | undefined;

    readonly transformQueryNames?: ((str: string) => string) | undefined;
    readonly transformResultNames?: ((str: string) => string) | undefined;
};

interface SqliteConnection extends SqlConnection.Connection {
    /**
     * Dump the database to a gzip-compressed blob encoded as Base64, where the
     * result is returned as a string. This is useful for inlining a cache in
     * your agent’s code, loaded by calling SqliteDatabase.openInline().
     */
    readonly dump: Effect.Effect<string, SqlError.SqlError>;
}

/**
 * @since 1.0.0
 * @category Constructor
 */
export const make = (
    options: SqliteClientConfig
): Effect.Effect<SqliteClient, SqlError.SqlError, Scope.Scope | Reactivity.Reactivity> =>
    Effect.gen(function* () {
        const compiler = Statement.makeCompilerSqlite(options.transformQueryNames);
        const transformRows = options.transformResultNames
            ? Statement.defaultTransforms(options.transformResultNames).array
            : undefined;

        const makeConnection = Effect.gen(function* () {
            const db = yield* Effect.acquireRelease(
                Effect.try({
                    try: () =>
                        "inlineData" in options
                            ? SqliteDatabase.openInline(options.inlineData)
                            : SqliteDatabase.open(options.filename, {
                                  flags: options.openFlags ?? ["readwrite", "create"],
                              }),
                    catch: (cause) =>
                        new SqlError.SqlError({
                            reason: classifyError(cause, "Failed to open database", "connect"),
                        }),
                }),
                (db) => Effect.sync(() => db.close())
            );

            if (options.disableWAL !== true) {
                yield* Effect.try({
                    try: () => db.exec("PRAGMA journal_mode = WAL"),
                    catch: (cause) =>
                        new SqlError.SqlError({
                            reason: classifyError(cause, "Failed to configure database", "connect"),
                        }),
                });
            }

            const prepare = (sql: string): Effect.Effect<SqliteStatement, SqlError.SqlError> =>
                Effect.try({
                    try: () => db.prepare(sql),
                    catch: (cause) =>
                        new SqlError.SqlError({
                            reason: classifyError(cause, "Failed to prepare statement", "prepare"),
                        }),
                });

            const prepareCache = yield* Cache.make({
                capacity: options.prepareCacheSize ?? 200,
                timeToLive: options.prepareCacheTTL ?? Duration.minutes(10),
                lookup: prepare,
            });

            const bind = (statement: SqliteStatement, index: number, param: unknown): void => {
                switch (typeof param) {
                    case "undefined":
                        return statement.bindNull(index);
                    case "string":
                        return statement.bindText(index, param);
                    case "number":
                        return Number.isSafeInteger(param)
                            ? statement.bindInteger(index, param)
                            : statement.bindFloat(index, param);
                    case "bigint":
                        return statement.bindInteger(index, Number(param));
                    case "boolean":
                        return statement.bindInteger(index, param ? 1 : 0);
                    case "object": {
                        if (param === null) return statement.bindNull(index);
                        if (param instanceof Date) return statement.bindText(index, param.toISOString());
                        if (param instanceof ArrayBuffer) return statement.bindBlob(index, param);
                        if (ArrayBuffer.isView(param)) {
                            const start = param.byteOffset;
                            const end = start + param.byteLength;
                            return statement.bindBlob(index, param.buffer.slice(start, end) as ArrayBuffer);
                        }
                    }
                }

                throw new TypeError(`Unsupported parameter type at index ${index}: ${typeof param}`);
            };

            const bindAll = (statement: SqliteStatement, params: ReadonlyArray<unknown>) => {
                for (let i = 0; i < params.length; i++) {
                    const p = params[i];
                    bind(statement, i + 1, p);
                }
            };

            const toRecord = (columns: ReadonlyArray<string>, row: ReadonlyArray<any>): Record<string, any> => {
                const record: Record<string, any> = {};
                for (let i = 0; i < columns.length; i++) record[columns[i]] = row[i];
                return record;
            };

            const runStatement = (
                statement: SqliteStatement,
                params: ReadonlyArray<unknown>,
                raw: boolean
            ): Effect.Effect<ReadonlyArray<any>, SqlError.SqlError, never> =>
                Effect.try({
                    try: () => {
                        try {
                            bindAll(statement, params);
                            let row: Array<any> | null;
                            const result: Array<any> = [];
                            if (raw) {
                                while ((row = statement.step()) !== null) result.push(row);
                                return result;
                            }
                            const columns = statement.columnNames;
                            while ((row = statement.step()) !== null) result.push(toRecord(columns, row));
                            return result;
                        } finally {
                            statement.reset();
                        }
                    },
                    catch: (cause) =>
                        new SqlError.SqlError({
                            reason: classifyError(cause, "Failed to execute statement", "execute"),
                        }),
                });

            const run = (
                sql: string,
                params: ReadonlyArray<unknown>,
                raw: boolean
            ): Effect.Effect<ReadonlyArray<any>, SqlError.SqlError, never> =>
                Effect.flatMap(Cache.get(prepareCache, sql), (s) => runStatement(s, params, raw));

            // Streams prepare their own statement, rather than taking one from
            // the cache, so that a query run while the stream is still open
            // can't step or reset it. Resetting on release ends the read
            // transaction even if the stream is not fully consumed.
            const stream = (
                sql: string,
                params: ReadonlyArray<unknown>
            ): Stream.Stream<Record<string, any>, SqlError.SqlError> =>
                Stream.scoped(
                    Stream.fromPull(
                        Effect.map(
                            Effect.acquireRelease(
                                Effect.tap(prepare(sql), (statement) =>
                                    Effect.try({
                                        try: () => bindAll(statement, params),
                                        catch: (cause) =>
                                            new SqlError.SqlError({
                                                reason: classifyError(cause, "Failed to bind parameters", "bind"),
                                            }),
                                    })
                                ),
                                (statement) => Effect.sync(() => statement.reset())
                            ),
                            (statement) => {
                                const columns = statement.columnNames;
                                // Stepping a finished statement would restart
                                // it
                                let done = false;
                                const step = Effect.try({
                                    try: () => {
                                        const rows: Array<Record<string, any>> = [];
                                        while (rows.length < STREAM_CHUNK_SIZE) {
                                            const row = statement.step();
                                            if (row === null) {
                                                done = true;
                                                break;
                                            }
                                            rows.push(toRecord(columns, row));
                                        }
                                        return rows;
                                    },
                                    catch: (cause) =>
                                        new SqlError.SqlError({
                                            reason: classifyError(cause, "Failed to execute statement", "stream"),
                                        }),
                                });
                                const pull: Pull.Pull<
                                    Array.NonEmptyReadonlyArray<Record<string, any>>,
                                    SqlError.SqlError
                                > = Effect.suspend(() =>
                                    done
                                        ? Cause.done()
                                        : Effect.filterOrElse(step, Array.isArrayNonEmpty, () => Cause.done())
                                );
                                return pull;
                            }
                        )
                    )
                );

            return Function.identity<SqliteConnection>({
                execute(sql, params, transformRows) {
                    const effect = run(sql, params, false);
                    return transformRows ? Effect.map(effect, transformRows) : effect;
                },
                executeRaw(sql, params) {
                    return run(sql, params, false);
                },
                executeValues(sql, params) {
                    return run(sql, params, true);
                },
                executeUnprepared(sql, params, transformRows) {
                    const effect = Effect.flatMap(prepare(sql), (s) => runStatement(s, params ?? [], false));
                    return transformRows ? Effect.map(effect, transformRows) : effect;
                },
                executeValuesUnprepared(sql, params) {
                    return Effect.flatMap(prepare(sql), (s) => runStatement(s, params ?? [], true));
                },
                executeStream(sql, params, transformRows) {
                    return transformRows
                        ? Stream.mapArray(
                              stream(sql, params),
                              (rows) => transformRows(rows) as Array.NonEmptyReadonlyArray<Record<string, any>>
                          )
                        : stream(sql, params);
                },
                dump: Effect.try({
                    try: () => db.dump(),
                    catch: (cause) =>
                        new SqlError.SqlError({
                            reason: new SqlError.UnknownError({
                                message: "Failed to dump database",
                                cause,
                            }),
                        }),
                }),
            });
        });

        // Frida doesn't expose sqlite3_get_autocommit, so there is no
        // isTransaction and a failed COMMIT always issues a ROLLBACK.
        const { acquirer, borrower, onCommitFailure, transactionAcquirer } = SqlClient.makeSqliteAcquirers({
            connection: Effect.succeed(yield* makeConnection),
            semaphore: yield* Semaphore.make(1),
        });

        return Object.assign(
            (yield* SqlClient.make({
                acquirer,
                borrower,
                compiler,
                transactionAcquirer,
                onCommitFailure,
                prepareTransactionControls: true,
                driver: "sqlite-frida",
                spanAttributes: [
                    ...(options.spanAttributes ? Object.entries(options.spanAttributes) : []),
                    [ATTR_DB_SYSTEM_NAME, "sqlite"],
                ],
                transformRows,
            })) as SqliteClient,
            {
                [TypeId]: TypeId,
                config: options,
                dump: Effect.scoped(Effect.flatMap(acquirer, (_) => _.dump)),
            }
        );
    });

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerConfig = (
    config: Config.Wrap<SqliteClientConfig>
): Layer.Layer<SqliteClient | SqlClient.SqlClient, Config.ConfigError | SqlError.SqlError> =>
    Layer.effectContext(
        Config.unwrap(config).pipe(
            Effect.flatMap(make),
            Effect.map((client) => Context.make(SqliteClient, client).pipe(Context.add(SqlClient.SqlClient, client)))
        )
    ).pipe(Layer.provide(Reactivity.layer));

/**
 * @since 1.0.0
 * @category Layers
 */
export const layer = (config: SqliteClientConfig): Layer.Layer<SqliteClient | SqlClient.SqlClient, SqlError.SqlError> =>
    Layer.effectContext(
        Effect.map(make(config), (client) =>
            Context.make(SqliteClient, client).pipe(Context.add(SqlClient.SqlClient, client))
        )
    ).pipe(Layer.provide(Reactivity.layer));
