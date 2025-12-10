/**
 * Effect `Runtime` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Exit from "effect/Exit";
import type * as FiberId from "effect/FiberId";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";
import * as FiberRefs from "effect/FiberRefs";
import * as Function from "effect/Function";
import * as HashSet from "effect/HashSet";
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
        Effect.tapErrorCause((cause): Effect.Effect<void, never, never> => {
            if (!Cause.isInterruptedOnly(cause)) {
                throwNextTick(cause);
                return Function.absurd(void undefined as never);
            } else {
                return Effect.void;
            }
        });

    const addPrettyLogger = (refs: FiberRefs.FiberRefs, fiberId: FiberId.Runtime): FiberRefs.FiberRefs => {
        const loggers = FiberRefs.getOrDefault(refs, FiberRef.currentLoggers);
        if (!HashSet.has(loggers, Logger.defaultLogger)) {
            return refs;
        }
        return FiberRefs.updateAs(refs, {
            fiberId,
            fiberRef: FiberRef.currentLoggers,
            value: loggers.pipe(HashSet.remove(Logger.defaultLogger), HashSet.add(Logger.prettyLoggerDefault)),
        });
    };

    const fiber = Effect.runFork(throwFromTapErrorCause(effect), {
        updateRefs: options?.disablePrettyLogger === true ? undefined : addPrettyLogger,
    } as const);

    fiber.addObserver((exit: Exit.Exit<A, E>): void =>
        Predicate.isNotUndefined(options?.teardown) ? options.teardown(exit) : void 0
    );
};
