/**
 * Frida device acquisition errors
 *
 * @since 1.0.0
 */

import * as PlatformError from "@effect/platform/Error";
import * as Predicate from "effect/Predicate";

/**
 * @since 1.0.0
 * @category Errors
 */
export const FridaDeviceAcquisitionErrorTypeId: unique symbol = Symbol.for(
    "@efffrida/FridaError/FridaDeviceAcquisitionError"
) as FridaDeviceAcquisitionErrorTypeId;

/**
 * @since 1.0.0
 * @category Errors
 */
export type FridaDeviceAcquisitionErrorTypeId = typeof FridaDeviceAcquisitionErrorTypeId;

/**
 * @since 1.0.0
 * @category Errors
 */
export const isFridaDeviceAcquisitionError = (u: unknown): u is FridaDeviceAcquisitionError =>
    Predicate.hasProperty(u, FridaDeviceAcquisitionErrorTypeId);

/**
 * @since 1.0.0
 * @category Errors
 */
export class FridaDeviceAcquisitionError extends PlatformError.TypeIdError(
    FridaDeviceAcquisitionErrorTypeId,
    "FridaDeviceAcquisitionError"
)<{
    cause: unknown;
    attempts: number;
    acquisitionMethod: "usb" | "remote" | "local" | "android-emulator";
}> {
    public override get message(): string {
        return `Failed to acquire ${this.acquisitionMethod} Frida device after ${this.attempts} attempt(s)`;
    }
}
