/**
 * Frida sql client for effect-ts.
 *
 * @since 1.0.0
 */

import type * as SqlConnection from "effect/unstable/sql/SqlConnection";

import * as Cache from "effect/Cache";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Match from "effect/Match";
import * as Predicate from "effect/Predicate";
import * as Scope from "effect/Scope";
import * as Semaphore from "effect/Semaphore";
import * as Stream from "effect/Stream";
import * as Reactivity from "effect/unstable/reactivity/Reactivity";
import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlError from "effect/unstable/sql/SqlError";
import * as Statement from "effect/unstable/sql/Statement";

/** @internal */
const ATTR_DB_SYSTEM_NAME = "db.system.name";

/** @internal */
const classifyError = (cause: unknown, message: string, operation: string) =>
    SqlError.classifySqliteError(cause, { message, operation });

/**
 * @since 1.0.0
 * @category Type ids
 */
export const TypeId: unique symbol = Symbol.for("@efffrida/effect-sql-frida/SqliteClient");

/**
 * @since 1.0.0
 * @category Type ids
 */
export type TypeId = typeof TypeId;

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

    /** Not supported in frida */
    readonly backup: never;
    readonly updateValues: never;
    readonly loadExtension: never;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export const SqliteClient = Context.Service<SqliteClient>("@efffrida/effect-sql-frida/SqliteClient");

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
): Effect.Effect<SqliteClient, never, Scope.Scope | Reactivity.Reactivity> =>
    Effect.gen(function* () {
        const compiler = Statement.makeCompilerSqlite(options.transformQueryNames);
        const transformRows = options.transformResultNames
            ? Statement.defaultTransforms(options.transformResultNames).array
            : undefined;

        const makeConnection = Effect.gen(function* () {
            const scope = yield* Effect.scope;
            const db =
                "inlineData" in options
                    ? SqliteDatabase.openInline(options.inlineData)
                    : SqliteDatabase.open(options.filename, { flags: options.openFlags ?? ["readwrite", "create"] });

            yield* Scope.addFinalizer(
                scope,
                Effect.sync(() => db.close())
            );

            if (options.disableWAL !== true) {
                db.exec("PRAGMA journal_mode = WAL");
            }

            const prepareCache = yield* Cache.make({
                capacity: options.prepareCacheSize ?? 200,
                timeToLive: options.prepareCacheTTL ?? Duration.minutes(10),
                lookup: (sql: string) =>
                    Effect.try({
                        try: () => db.prepare(sql),
                        catch: (cause) =>
                            new SqlError.SqlError({
                                reason: classifyError(cause, "Failed to prepare statement", "prepare"),
                            }),
                    }),
            });

            const isInt8Array = (input: unknown): input is Int8Array => input instanceof Int8Array;

            const bind = (statement: SqliteStatement, index: number, param: unknown) =>
                Function.pipe(
                    Match.value(param),
                    Match.when(Predicate.isNull, () => statement.bindNull(index)),
                    Match.when(Predicate.isString, (p) => statement.bindText(index, p)),
                    Match.when(Predicate.isNumber, (p) => statement.bindFloat(index, p)),
                    Match.when(Predicate.isDate, (p) => statement.bindText(index, p.toISOString())),
                    Match.when(Predicate.isBigInt, (p) => statement.bindInteger(index, Number(p))),
                    Match.when(Predicate.isBoolean, (p) => statement.bindInteger(index, Number(p))),
                    Match.when(Predicate.isUint8Array, (p) => statement.bindBlob(index, Array.from(p))),
                    Match.when(Predicate.isUint8Array, (p) => statement.bindBlob(index, Array.from(p))),
                    Match.when(isInt8Array, (p) => statement.bindBlob(index, Array.from(p))),
                    Match.orElseAbsurd
                );

            const bindAll = (statement: SqliteStatement, params: ReadonlyArray<unknown>) => {
                for (let i = 0; i < params.length; i++) {
                    const p = params[i];
                    bind(statement, i + 1, p);
                }
            };

            const runStatement = (
                statement: SqliteStatement,
                params: ReadonlyArray<unknown>
            ): Effect.Effect<ReadonlyArray<any>, SqlError.SqlError, never> =>
                Effect.try({
                    try: () => {
                        bindAll(statement, params);
                        let row: Array<any> | null;
                        const result: Array<any> = [];
                        while ((row = statement.step()) !== null) result.push(row);
                        statement.reset();
                        return result;
                    },
                    catch: (cause) =>
                        new SqlError.SqlError({
                            reason: classifyError(cause, "Failed to execute statement", "execute"),
                        }),
                });

            const run = (
                sql: string,
                params: ReadonlyArray<unknown>
            ): Effect.Effect<ReadonlyArray<any>, SqlError.SqlError, never> =>
                Effect.flatMap(Cache.get(prepareCache, sql), (s) => runStatement(s, params));

            return Function.identity<SqliteConnection>({
                execute(sql, params, transformRows) {
                    return transformRows ? Effect.map(run(sql, params), transformRows) : run(sql, params);
                },
                executeRaw(sql, params) {
                    return run(sql, params);
                },
                executeValues(sql, params) {
                    return run(sql, params);
                },
                executeUnprepared(sql, params, transformRows) {
                    const effect = runStatement(db.prepare(sql), params ?? []);
                    return transformRows ? Effect.map(effect, transformRows) : effect;
                },
                executeValuesUnprepared(sql, params) {
                    return runStatement(db.prepare(sql), params ?? []);
                },
                executeStream(_sql, _params, _transformRows) {
                    return Stream.die("executeStream not implemented");
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

        const semaphore = yield* Semaphore.make(1);
        const connection = yield* makeConnection;

        const acquirer = semaphore.withPermits(1)(Effect.succeed(connection));
        const transactionAcquirer = Effect.uninterruptibleMask((restore) =>
            Effect.as(
                Effect.andThen(
                    restore(semaphore.take(1)),
                    Effect.tap(Effect.scope, (scope) => Scope.addFinalizer(scope, semaphore.release(1)))
                ),
                connection
            )
        );

        return Object.assign(
            (yield* SqlClient.make({
                acquirer,
                compiler,
                transactionAcquirer,
                spanAttributes: [
                    ...(options.spanAttributes ? Object.entries(options.spanAttributes) : []),
                    [ATTR_DB_SYSTEM_NAME, "sqlite"],
                ],
                transformRows,
            })) as SqliteClient,
            {
                [TypeId]: TypeId as TypeId,
                config: options,
                dump: Effect.flatMap(acquirer, (_) => _.dump),
            }
        );
    });

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerConfig = (
    config: Config.Wrap<SqliteClientConfig>
): Layer.Layer<SqliteClient | SqlClient.SqlClient, Config.ConfigError> =>
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
export const layer = (
    config: SqliteClientConfig
): Layer.Layer<SqliteClient | SqlClient.SqlClient, Config.ConfigError> =>
    Layer.effectContext(
        Effect.map(make(config), (client) =>
            Context.make(SqliteClient, client).pipe(Context.add(SqlClient.SqlClient, client))
        )
    ).pipe(Layer.provide(Reactivity.layer));
