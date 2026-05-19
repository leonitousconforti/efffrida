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
export const runMain = <A, E>(
    effect: Effect.Effect<A, E, never>,
    options?:
        | {
              readonly disablePrettyLogger?: boolean | undefined;
              readonly teardown?: ((exit: Exit.Exit<A, E>) => void) | undefined;
          }
        | undefined
): void => {
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
        options?.disablePrettyLogger === true
            ? Function.identity<Effect.Effect<A, E, never>>
            : Effect.provide(Logger.layer([Logger.consolePretty()]));

    const fiber = Effect.runFork(withLogger(throwFromTapErrorCause(effect)));

    fiber.addObserver((exit: Exit.Exit<A, E>): void =>
        Predicate.isNotUndefined(options?.teardown) ? options.teardown(exit) : void 0
    );
};
