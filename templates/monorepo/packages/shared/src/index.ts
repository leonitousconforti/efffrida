import * as Schema from "effect/Schema";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

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
