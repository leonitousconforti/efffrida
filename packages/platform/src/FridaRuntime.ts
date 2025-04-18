/**
 * Effect `Runtime` utilities for Frida.
 *
 * @since 1.0.0
 */

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";

/**
 * @since 1.0.0
 * @category Runtime
 */
export const runMain = <A, E>(effect: Effect.Effect<A, E, never>): void => {
    const throwNextTick = (throwable: unknown): void =>
        Script.nextTick((error) => {
            throw error;
        }, throwable);

    Effect.runFork(
        Effect.tapErrorCause(effect, (cause) => {
            if (Cause.isInterrupted(cause)) return Effect.void;
            // const error = Cause.failureOrCause(cause);
            // if (error._tag === "Left") {
            //     throwNextTick(error.left);
            // } else {
            //     throwNextTick(error.right);
            // }
            throwNextTick(cause);
            return Effect.void;
        })
    );
};
