/**
 * Frida session errors
 *
 * @since 1.0.0
 */

import * as PlatformError from "@effect/platform/Error";
import * as Predicate from "effect/Predicate";

/**
 * @since 1.0.0
 * @category Errors
 */
export const FridaSessionErrorTypeId: unique symbol = Symbol.for(
    "@efffrida/FridaError/FridaSessionError"
) as FridaSessionErrorTypeId;

/**
 * @since 1.0.0
 * @category Errors
 */
export type FridaSessionErrorTypeId = typeof FridaSessionErrorTypeId;

/**
 * @since 1.0.0
 * @category Errors
 */
export const isFridaSessionError = (u: unknown): u is FridaSessionError =>
    Predicate.hasProperty(u, FridaSessionErrorTypeId);

/**
 * @since 1.0.0
 * @category Errors
 */
export class FridaSessionError extends PlatformError.TypeIdError(FridaSessionErrorTypeId, "FridaSessionError")<{
    cause: unknown;
    when: "spawn" | "kill" | "attach" | "detach" | "compile" | "load" | "unload" | "resume" | "message" | "rpcCall";
}> {
    get message() {
        return `A Frida session error occurred on ${this.when}`;
    }
}
