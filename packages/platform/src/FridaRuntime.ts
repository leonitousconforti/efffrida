/**
 * Effect `Runtime` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Exit from "effect/Exit";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Logger from "effect/Logger";
import * as Predicate from "effect/Predicate";

/**
 * @since 1.0.0
 * @category Runtime
 */
export const runMain = Function.dual<
    <A, E>(options?: {
        readonly disablePrettyLogger?: boolean | undefined;
        readonly teardown?: ((exit: Exit.Exit<A, E>) => void) | undefined;
    }) => (effect: Effect.Effect<A, E, never>) => void,
    <A, E>(
        effect: Effect.Effect<A, E, never>,
        options?:
            | {
                  readonly disablePrettyLogger?: boolean | undefined;
                  readonly teardown?: ((exit: Exit.Exit<A, E>) => void) | undefined;
              }
            | undefined
    ) => void
>(
    (arguments_) => Effect.isEffect(arguments_[0]),
    (effect, options) => {
        const throwNextTick = (throwable: unknown): void =>
            Script.nextTick((error): never => {
                throw error;
            }, throwable);

        const throwFromTapErrorCause: <A1, E1, R1>(self: Effect.Effect<A1, E1, R1>) => Effect.Effect<A1, E1, R1> =
            Effect.tapCause((cause): Effect.Effect<void, never, never> => {
                if (!Cause.hasInterruptsOnly(cause)) {
                    throwNextTick(cause);
                    return Function.absurd(void undefined as never);
                } else {
                    return Effect.void;
                }
            });

        const withLogger =
            options?.disablePrettyLogger === false
                ? Effect.provide(Logger.layer([Logger.consolePretty()]))
                : Function.identity;

        const fiber = Effect.runFork(withLogger(throwFromTapErrorCause(effect)));
        fiber.addObserver((exit) => (Predicate.isNotUndefined(options?.teardown) ? options.teardown(exit) : void 0));
    }
);
