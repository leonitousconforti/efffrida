/**
 * Effect `Runtime` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as Exit from "effect/Exit";

import * as Cause from "effect/Cause";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Logger from "effect/Logger";
import * as Predicate from "effect/Predicate";

/**
 * Frida's console only has `log`, `info`, `warn`, `error` and `debug`. The rest
 * are filled in so that effect's loggers, e.g. the grouping done by the pretty
 * logger, don't throw.
 */
const globalConsole = globalThis.console;

// @effect-diagnostics globalConsole:off
const fridaConsole: Console.Console = {
    log: (...args) => globalConsole.log(...args),
    info: (...args) => globalConsole.info(...args),
    warn: (...args) => globalConsole.warn(...args),
    error: (...args) => globalConsole.error(...args),
    debug: (...args) => globalConsole.debug(...args),
    trace: (...args) => globalConsole.log(...args),
    dir: (item) => globalConsole.log(item),
    dirxml: (...args) => globalConsole.log(...args),
    table: (tabularData) => globalConsole.log(tabularData),
    assert: (condition, ...args) => {
        if (!condition) globalConsole.error("Assertion failed", ...args);
    },
    group: (...args) => {
        if (args.length > 0) globalConsole.log(...args);
    },
    groupCollapsed: (...args) => {
        if (args.length > 0) globalConsole.log(...args);
    },
    groupEnd: Function.constVoid,
    clear: Function.constVoid,
    count: Function.constVoid,
    countReset: Function.constVoid,
    time: Function.constVoid,
    timeEnd: Function.constVoid,
    timeLog: Function.constVoid,
};
// @effect-diagnostics globalConsole:warning

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
                    return Function.absurd(undefined as never);
                } else {
                    return Effect.void;
                }
            });

        const withLogger =
            options?.disablePrettyLogger === true
                ? Function.identity
                : // oxlint-disable-next-line effecttsgo/strict-effect-provide
                  Effect.provide(Logger.layer([Logger.consolePretty({ mode: "tty" })]));

        Effect.runFork(
            withLogger(throwFromTapErrorCause(effect)).pipe(Effect.provideService(Console.Console, fridaConsole))
        ).addObserver((exit) => (Predicate.isNotUndefined(options?.teardown) ? options.teardown(exit) : void 0));
    }
);
