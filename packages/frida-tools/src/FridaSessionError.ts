/**
 * Frida session errors
 *
 * @since 1.0.0
 */

import * as Data from "effect/Data";

/**
 * @since 1.0.0
 * @category Errors
 */
export class FridaSessionError extends Data.TaggedError("FridaSessionError")<{
    cause: unknown;
    when:
        | "spawn"
        | "kill"
        | "attach"
        | "detach"
        | "compile"
        | "watch"
        | "load"
        | "unload"
        | "resume"
        | "message"
        | "rpcCall";
}> {
    override get message() {
        return `A Frida session error occurred on ${this.when}`;
    }
}
