/**
 * Frida devices
 *
 * @since 1.0.0
 */

import type * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Frida from "frida";
import type * as FridaDeviceAcquisitionError from "./FridaDeviceAcquisitionError.ts";

import * as internal from "./internal/device.ts";

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
    readonly device: Frida.Device;
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
export const isFridaDevice: (u: unknown) => u is FridaDevice = internal.isFridaDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireUsbDevice: (
    options?: Frida.GetDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =
    internal.acquireUsbDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireRemoteDevice: (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =
    internal.acquireRemoteDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireLocalDevice: () => Effect.Effect<
    FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    never
> = internal.acquireLocalDevice;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerRemoteDevice: (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =
    internal.layerRemoteDevice;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerUsbDevice: (
    options?: Frida.GetDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> = internal.layerUsbDevice;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerLocalDevice: Layer.Layer<
    FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    never
> = internal.layerLocalDevice;
