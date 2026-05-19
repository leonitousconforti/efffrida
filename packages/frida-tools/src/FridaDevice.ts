/**
 * Frida devices
 *
 * @since 1.0.0
 */

import type * as Config from "effect/Config";
import type * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Path from "effect/Path";
import type * as Scope from "effect/Scope";
import type * as ChildProcessSpawner from "effect/unstable/process/ChildProcessSpawner";

import type * as FridaDeviceAcquisitionError from "./FridaDeviceAcquisitionError.ts";
import type * as Frida from "frida";

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
    readonly host: `usb://` | `local://` | `remote://${string}` | `android-emulator://${string}`;
    readonly [FridaDeviceTypeId]: typeof FridaDeviceTypeId;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export const FridaDevice: Context.Service<FridaDevice, FridaDevice> = internal.Tag;

/**
 * @since 1.0.0
 * @category Predicates
 */
export const isFridaDevice: (u: unknown) => u is FridaDevice = internal.isFridaDevice;

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
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, Scope.Scope> =
    internal.acquireRemoteDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireAndroidEmulatorDevice: (
    name: string,
    options?:
        | {
              hidden?: boolean | undefined;
              adbExecutable?: string | undefined;
              fridaExecutable?: string | undefined;
              emulatorExecutable?: string | undefined;
              extraEmulatorArgs?: Array<string> | undefined;
          }
        | undefined
) => Effect.Effect<
    FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner | Scope.Scope
> = internal.acquireAndroidEmulatorDevice;

/**
 * @since 1.0.0
 * @category Device acquisition
 */
export const acquireAndroidEmulatorDeviceConfig: (
    name: string,
    options?:
        | {
              hidden?: boolean | undefined;
              fridaExecutable?: string | undefined;
              extraEmulatorArgs?: Array<string> | undefined;
          }
        | undefined
) => Effect.Effect<
    FridaDevice,
    Config.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner | Path.Path | Scope.Scope
> = internal.acquireAndroidEmulatorDeviceConfig;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerLocalDevice: Layer.Layer<
    FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    never
> = internal.layerLocalDevice;

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
export const layerAndroidEmulatorDevice: (
    name: string,
    options?:
        | {
              hidden?: boolean | undefined;
              adbExecutable?: string | undefined;
              fridaExecutable?: string | undefined;
              emulatorExecutable?: string | undefined;
              extraEmulatorArgs?: Array<string> | undefined;
          }
        | undefined
) => Layer.Layer<
    FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner
> = internal.layerAndroidEmulatorDevice;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerAndroidEmulatorDeviceConfig: (
    name: string,
    options?:
        | {
              hidden?: boolean | undefined;
              fridaExecutable?: string | undefined;
              extraEmulatorArgs?: Array<string> | undefined;
          }
        | undefined
) => Layer.Layer<
    FridaDevice,
    Config.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner | Path.Path
> = internal.layerAndroidEmulatorDeviceConfig;
