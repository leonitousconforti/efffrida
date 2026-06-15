/**
 * @since 1.0.0
 * @category FridaIl2cppBridge
 */

import "frida-il2cpp-bridge";

import * as Effect from "effect/Effect";
import * as Function from "effect/Function";

/**
 * Attaches the caller thread to Il2Cpp domain and executes the given block.
 *
 * @since 1.0.0
 */
export const il2cppPerformEffect = Function.dual<
    (
        flag?: "free" | "bind" | "leak" | "main" | undefined
    ) => <X, E, R>(effect: Effect.Effect<X, E, R>) => Effect.Effect<X, E, R>,
    <X, E, R>(
        effect: Effect.Effect<X, E, R>,
        flag?: "free" | "bind" | "leak" | "main" | undefined
    ) => Effect.Effect<X, E, R>
>(
    (arguments_) => Effect.isEffect(arguments_[0]),
    Effect.fnUntraced(function* <X, E, R>(
        effect: Effect.Effect<X, E, R>,
        flag?: "free" | "bind" | "leak" | "main" | undefined
    ): Effect.fn.Return<X, E, R> {
        const services = yield* Effect.context<R>();
        const runPromiseExit = Effect.runPromiseExitWith(services);
        const exit = yield* Effect.promise((abortSignal) =>
            Il2Cpp.perform(
                () =>
                    runPromiseExit(effect, {
                        signal: abortSignal,
                    }),
                flag
            )
        );
        return yield* exit;
    })
);
