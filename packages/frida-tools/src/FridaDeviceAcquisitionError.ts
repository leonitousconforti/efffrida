/**
 * Frida device acquisition errors
 *
 * @since 1.0.0
 */

import * as Data from "effect/Data";

/**
 * @since 1.0.0
 * @category Errors
 */
export class FridaDeviceAcquisitionError extends Data.TaggedError("FridaDeviceAcquisitionError")<{
    acquisitionMethod: "usb" | "remote" | "local" | "android-emulator";
    attempts: number;
    cause: unknown;
}> {
    public override get message(): string {
        return `Failed to acquire ${this.acquisitionMethod} Frida device after ${this.attempts} attempt(s)`;
    }
}
