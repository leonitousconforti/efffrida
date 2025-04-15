import * as Rpc from "@effect/rpc/Rpc";
import * as RpcGroup from "@effect/rpc/RpcGroup";
import * as Schema from "effect/Schema";

export class SqlRpcs extends RpcGroup.make(
    Rpc.make("sql", {
        success: Schema.Any,
        error: Schema.String,
        payload: { statement: Schema.String },
    }),
    Rpc.make("raw", {
        success: Schema.Any,
        error: Schema.String,
        payload: { statement: Schema.String },
    }),
    Rpc.make("transaction", {
        success: Schema.Any,
        error: Schema.String,
        payload: { statement: Schema.String },
    }),
    Rpc.make("transactionRollback", {
        success: Schema.Any,
        error: Schema.String,
        payload: { statement: Schema.String },
    })
) {}
