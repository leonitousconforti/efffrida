import type * as Rpc from "@effect/rpc/Rpc";
import type * as RpcGroup from "@effect/rpc/RpcGroup";
import type * as Scope from "effect/Scope";

import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Effect from "effect/Effect";

/**
 * @since 1.0.0
 * @category Constructors
 */
export const makeClient: <Rpcs extends Rpc.Any>(
    script: string,
    group: RpcGroup.RpcGroup<Rpcs>
) => Effect.Effect<
    RpcClient.RpcClient<Rpcs>,
    never,
    Scope.Scope | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.MiddlewareClient<Rpcs>
> = Effect.fnUntraced(function* <Rpcs extends Rpc.Any>(script: string, group: RpcGroup.RpcGroup<Rpcs>) {
    // eslint-disable-next-line prefer-const
    let client!: Effect.Effect.Success<ReturnType<typeof RpcClient.makeNoSerialization<Rpcs, never>>>;
    const server = yield* RpcServer.makeNoSerialization(group, {
        onFromServer(response) {
            return client.write(response);
        },
    });
    client = yield* RpcClient.makeNoSerialization(group, {
        supportsAck: true,
        onFromClient({ message }) {
            return server.write(0, message);
        },
    });
    return client.client;
});
