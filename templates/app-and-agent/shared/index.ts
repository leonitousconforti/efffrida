import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";

export class AgentRpcs extends RpcGroup.make(
    Rpc.make("Ping", {
        success: Schema.String,
    }),
    Rpc.make("Echo", {
        success: Schema.String,
        payload: {
            message: Schema.String,
        },
    })
) {}
