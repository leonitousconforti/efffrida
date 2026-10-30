/**
 * Effect `Runtime` utilities for Frida.
 *
 * @since 1.0.0
 */

import * as Cause from "effect/Cause";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Function from "effect/Function";
import * as Logger from "effect/Logger";
import * as Runtime from "effect/Runtime";

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
 * Runs the main fiber. A failure that isn't only interruption is thrown on the
 * next tick once the teardown reports a non zero exit code, so that Frida
 * reports it to the host as a script error.
 */
const runMainFrida = Runtime.makeRunMain(({ fiber, teardown }) => {
    const throwNextTick = (throwable: unknown): void =>
        Script.nextTick((error): never => {
            throw error;
        }, throwable);

    fiber.addObserver((exit) =>
        teardown(exit, (code) => {
            if (code === 0 || Exit.isSuccess(exit) || Cause.hasInterruptsOnly(exit.cause)) return;
            throwNextTick(exit.cause);
        })
    );
});

/**
 * @since 1.0.0
 * @category Runtime
 */
export interface RunMainOptions {
    readonly disableErrorReporting?: boolean | undefined;
    readonly disablePrettyLogger?: boolean | undefined;
    readonly teardown?: Runtime.Teardown | undefined;
}

/**
 * Runs an Effect as the main program of a Frida agent, like
 * `NodeRuntime.runMain`. Unless disabled, the pretty logger is installed and
 * failures are logged. A failure is also thrown so that Frida reports it to the
 * host, see {@link RunMainOptions.teardown} to customize that.
 *
 * @since 1.0.0
 * @category Runtime
 */
export const runMain: {
    (options?: RunMainOptions | undefined): <E, A>(effect: Effect.Effect<A, E>) => void;
    <E, A>(effect: Effect.Effect<A, E>, options?: RunMainOptions | undefined): void;
} = Function.dual(
    (arguments_) => Effect.isEffect(arguments_[0]),
    <E, A>(effect: Effect.Effect<A, E>, options?: RunMainOptions | undefined): void => {
        // Reported here rather than by makeRunMain, so that the log goes
        // through the pretty logger and the Frida console below
        const reportErrors: <A1, E1, R1>(self: Effect.Effect<A1, E1, R1>) => Effect.Effect<A1, E1, R1> =
            options?.disableErrorReporting === true
                ? Function.identity
                : Effect.tapCause((cause) =>
                      Cause.hasInterruptsOnly(cause) || !Runtime.getErrorReported(Cause.squash(cause))
                          ? Effect.void
                          : Effect.logError(cause)
                  );

        const withLogger =
            options?.disablePrettyLogger === true
                ? Function.identity
                : // oxlint-disable-next-line effecttsgo/strict-effect-provide
                  Effect.provide(Logger.layer([Logger.consolePretty({ mode: "tty" })]));

        runMainFrida(withLogger(reportErrors(effect)).pipe(Effect.provideService(Console.Console, fridaConsole)), {
            disableErrorReporting: true,
            teardown: options?.teardown,
        });
    }
);
