import { RpcResolver, RpcResolverNoStream, type Rpc, type RpcRouter } from "@effect/rpc";
import { Effect, type RequestResolver, type Schema } from "effect";
import { Script } from "frida";
import { TypeId } from "./FridaRpcExports.js";

/**
 * @since 1.0.0
 * @category Constructors
 */
export const make = <Router extends RpcRouter.RpcRouter<any, any>>(
    script: Script
): RequestResolver.RequestResolver<
    Rpc.Request<RpcRouter.RpcRouter.Request<Router>>,
    Schema.SerializableWithResult.Context<RpcRouter.RpcRouter.Request<Router>>
> =>
    RpcResolverNoStream.make((requests: readonly unknown[]) =>
        Effect.tryPromise(() => script.exports[TypeId](requests))
    )<Router>();

/**
 * @since 1.0.0
 * @category Constructors
 */
export const makeClient = <Router extends RpcRouter.RpcRouter<any, any>>(
    script: Script
): Schema.SerializableWithResult.Context<RpcRouter.RpcRouter.Request<Router>> extends never
    ? RpcResolver.Client<RequestResolver.RequestResolver<Rpc.Request<RpcRouter.RpcRouter.Request<Router>>>>
    : "request context is not `never`" =>
    RpcResolver.toClient(
        make<Router>(script) as RequestResolver.RequestResolver<Rpc.Request<RpcRouter.RpcRouter.Request<Router>>, never>
    ) as Schema.SerializableWithResult.Context<RpcRouter.RpcRouter.Request<Router>> extends never
        ? RpcResolver.Client<RequestResolver.RequestResolver<Rpc.Request<RpcRouter.RpcRouter.Request<Router>>>>
        : "request context is not `never`";
