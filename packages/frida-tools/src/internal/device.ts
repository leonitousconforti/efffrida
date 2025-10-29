import type * as FridaDevice from "../FridaDevice.ts";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Predicate from "effect/Predicate";
import * as Frida from "frida";

import * as FridaDeviceAcquisitionError from "../FridaDeviceAcquisitionError.ts";

/** @internal */
export const FridaDeviceTypeId: FridaDevice.FridaDeviceTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaDevice"
) as FridaDevice.FridaDeviceTypeId;

/** @internal */
export const Tag = Context.GenericTag<FridaDevice.FridaDevice>("@efffrida/frida-tools/FridaDevice");

/** @internal */
export const isFridaDevice = (u: unknown): u is FridaDevice.FridaDevice => Predicate.hasProperty(u, FridaDeviceTypeId);

/** @internal */
export const acquireUsbDevice = (
    options?: Frida.GetDeviceOptions | undefined
): Effect.Effect<FridaDevice.FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =>
    Effect.map(
        Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return Frida.getUsbDevice(options, cancellable);
            },
            catch: (cause) =>
                new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                    cause,
                    attempts: 1,
                    acquisitionMethod: "usb",
                }),
        }),
        (device) => ({ device, [FridaDeviceTypeId]: FridaDeviceTypeId }) as const
    );

/** @internal */
export const acquireRemoteDevice = (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
): Effect.Effect<FridaDevice.FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =>
    Effect.map(
        Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return Frida.getDeviceManager().addRemoteDevice(address, options, cancellable);
            },
            catch: (cause) =>
                new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                    cause,
                    attempts: 1,
                    acquisitionMethod: "remote",
                }),
        }),
        (device) => ({ device, [FridaDeviceTypeId]: FridaDeviceTypeId }) as const
    );

/** @internal */
export const acquireLocalDevice = (): Effect.Effect<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    never
> =>
    Effect.map(
        Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return Frida.getLocalDevice();
            },
            catch: (cause) =>
                new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                    cause,
                    attempts: 1,
                    acquisitionMethod: "local",
                }),
        }),
        (device) => ({ device, [FridaDeviceTypeId]: FridaDeviceTypeId }) as const
    );

/** @internal */
export const layerRemoteDevice = (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
): Layer.Layer<FridaDevice.FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =>
    Layer.effect(Tag, acquireRemoteDevice(address, options));

/** @internal */
export const layerUsbDevice = (
    options?: Frida.GetDeviceOptions | undefined
): Layer.Layer<FridaDevice.FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never> =>
    Layer.effect(Tag, acquireUsbDevice(options));

/** @internal */
export const layerLocalDevice: Layer.Layer<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    never
> = Layer.effect(Tag, acquireLocalDevice());
