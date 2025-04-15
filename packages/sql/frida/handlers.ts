import type * as Rpc from "@effect/rpc/Rpc";
import type * as Layer from "effect/Layer";

import * as SqlClient from "@effect/sql/SqlClient";
import * as Effect from "effect/Effect";
import { SqlRpcs } from "../shared/requests.js";

export const SqlLive: Layer.Layer<
    Rpc.Handler<"raw"> | Rpc.Handler<"sql"> | Rpc.Handler<"transaction"> | Rpc.Handler<"transactionRollback">,
    never,
    SqlClient.SqlClient
> = SqlRpcs.toLayer(
    Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        return {
            sql: ({ statement }) => Effect.mapError(sql.unsafe(statement), (error) => error.message),
            raw: ({ statement }) => Effect.mapError(sql.unsafe(statement).raw, (error) => error.message),
            transaction: ({ statement }) =>
                Effect.mapError(sql.withTransaction(sql.unsafe(statement)), (error) => error.message),
            transactionRollback: ({ statement }) =>
                sql
                    .unsafe(statement)
                    .pipe(Effect.andThen(Effect.fail("boom")))
                    .pipe(sql.withTransaction)
                    .pipe(Effect.ignore),
        };
    })
);
