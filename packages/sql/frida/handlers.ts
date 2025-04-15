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
            raw: ({ statement }) => Effect.mapError(sql`${statement}`.raw, (error) => error.message),
            sql: ({ statement }) => Effect.mapError(sql`${statement}`, (error) => error.message),
            transaction: ({ statement }) =>
                Effect.mapError(sql.withTransaction(sql`${statement}`), (error) => error.message),
            transactionRollback: ({ statement }) =>
                sql`${statement}`
                    .pipe(Effect.andThen(Effect.fail("boom")))
                    .pipe(sql.withTransaction)
                    .pipe(Effect.ignore),
        };
    })
);
