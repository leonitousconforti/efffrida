/**
 * Frida effect module.
 *
 * @since 1.0.0
 */

import type * as Cause from "effect/Cause";
import type * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import type * as Frida from "frida";

import * as internal from "./internal/frida.js";

/**
 * @since 1.0.0
 * @category Type ids
 */
export const FridaDeviceTypeId: unique symbol = internal.FridaDeviceTypeId;

/**
 * @since 1.0.0
 * @category Type ids
 */
export type FridaDeviceTypeId = typeof FridaDeviceTypeId;

/**
 * @since 1.0.0
 * @category Models
 */
export interface FridaDevice {
    readonly underlying: Frida.Device;
    readonly [FridaDeviceTypeId]: typeof FridaDeviceTypeId;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export const FridaDevice: Context.Tag<FridaDevice, FridaDevice> = internal.Tag;

/**
 * @since 1.0.0
 * @category Predicates
 */
export const isFridaDevice: (u: unknown) => u is Frida.Device = internal.isFridaDevice;

/**
 * @since 1.0.0
 * @category Frida
 */
export const spawn: {
    (
        program: string | Array<string>,
        options?: Frida.SpawnOptions | undefined
    ): (device: FridaDevice) => Effect.Effect<number, Cause.UnknownException, Scope.Scope>;
    (
        device: FridaDevice,
        program: string | Array<string>,
        options?: Frida.SpawnOptions | undefined
    ): Effect.Effect<number, Cause.UnknownException, Scope.Scope>;
} = internal.spawn;

/**
 * @since 1.0.0
 * @category Frida
 */
export const attach: {
    (
        target: Frida.TargetProcess,
        options?: Frida.SessionOptions | undefined
    ): (device: FridaDevice) => Effect.Effect<Frida.Session, Cause.UnknownException, Scope.Scope>;
    (
        device: FridaDevice,
        target: Frida.TargetProcess,
        options?: Frida.SessionOptions | undefined
    ): Effect.Effect<Frida.Session, Cause.UnknownException, Scope.Scope>;
} = internal.attach;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireUsbDevice: (
    options?: Frida.GetDeviceOptions | undefined
) => Effect.Effect<FridaDevice, Cause.UnknownException, never> = internal.acquireUsbDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireRemoteDevice: (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
) => Effect.Effect<FridaDevice, Cause.UnknownException, never> = internal.acquireRemoteDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireLocalDevice: () => Effect.Effect<FridaDevice, Cause.UnknownException, never> =
    internal.acquireLocalDevice;

/**
 * @since 1.0.0
 * @category Layers
 */
export const RemoteDeviceLayer: (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
) => Layer.Layer<FridaDevice, Cause.UnknownException, never> = internal.RemoteDeviceLayer;

/**
 * @since 1.0.0
 * @category Layers
 */
export const UsbDeviceLayer: (
    options?: Frida.GetDeviceOptions | undefined
) => Layer.Layer<FridaDevice, Cause.UnknownException, never> = internal.UsbDeviceLayer;

/**
 * @since 1.0.0
 * @category Layers
 */
export const LocalDeviceLayer: () => Layer.Layer<FridaDevice, Cause.UnknownException, never> =
    internal.LocalDeviceLayer;
