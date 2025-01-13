import { RpcRouter } from "@effect/rpc";
import { Effect, Function, Runtime } from "effect";
import { type ScriptExports } from "frida";
import { TypeId } from "./FridaRpcExports.js";

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toScriptExports = Function.dual<
    // Data-last signature
    (
        options?: { readonly spanPrefix?: string } | undefined
    ) => <Router extends RpcRouter.RpcRouter<any, any>>(
        self: Router
    ) => Effect.Effect<ScriptExports, never, RpcRouter.RpcRouter.Context<Router>>,
    // Data-first signature
    <Router extends RpcRouter.RpcRouter<any, any>>(
        self: Router,
        options?: { readonly spanPrefix?: string } | undefined
    ) => Effect.Effect<ScriptExports, never, RpcRouter.RpcRouter.Context<Router>>
>(
    // Data first if the first argument is a router
    (arguments_) => RpcRouter.isRpcRouter(arguments_[0]),

    // Body implementation
    <Router extends RpcRouter.RpcRouter<any, any>>(
        self: Router,
        options?: { readonly spanPrefix?: string } | undefined
    ): Effect.Effect<ScriptExports, never, RpcRouter.RpcRouter.Context<Router>> =>
        Effect.Do.pipe(
            Effect.bind("runtime", () => Effect.runtime<RpcRouter.RpcRouter.Context<Router>>()),
            Effect.let("handler", () => RpcRouter.toHandlerNoStream(self, options)),
            Effect.map(({ runtime, handler }) => ({
                [TypeId]: (request: readonly unknown[]) => Runtime.runPromise(runtime)(handler(request)),
            }))
        )
);
