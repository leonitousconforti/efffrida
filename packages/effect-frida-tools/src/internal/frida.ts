import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Predicate from "effect/Predicate";
import * as Scope from "effect/Scope";
import * as Frida from "frida";

import type * as FridaEffect from "../Frida.js";

/** @internal */
export const FridaDeviceTypeId: FridaEffect.FridaDeviceTypeId = Symbol.for(
    "@efffrida/effect-frida-tools/Frida/FridaDevice"
) as FridaEffect.FridaDeviceTypeId;

/** @internal */
export const Tag = Context.GenericTag<FridaEffect.FridaDevice>("@efffrida/effect-frida-tools/Frida/FridaDevice");

/** @internal */
export const isFridaDevice = (u: unknown): u is Frida.Device => Predicate.hasProperty(u, FridaDeviceTypeId);

/** @internal */
export const spawn = Function.dual<
    // Data-last signature.
    (
        program: string | Array<string>,
        options?: Frida.SpawnOptions | undefined
    ) => (device: FridaEffect.FridaDevice) => Effect.Effect<number, Cause.UnknownException, Scope.Scope>,
    // Data-first signature.
    (
        device: FridaEffect.FridaDevice,
        program: string | Array<string>,
        options?: Frida.SpawnOptions | undefined
    ) => Effect.Effect<number, Cause.UnknownException, Scope.Scope>
>(
    (arguments_) => isFridaDevice(arguments_[0]),
    (device: FridaEffect.FridaDevice, program: string | string[], options) =>
        Effect.acquireRelease(
            Effect.tryPromise(() => device.underlying.spawn(program, options)),
            (pid) => Effect.promise(() => device.underlying.kill(pid))
        )
);

/** @internal */
export const attach = Function.dual<
    // Data-last signature.
    (
        target: Frida.TargetProcess,
        options?: Frida.SessionOptions | undefined
    ) => (device: FridaEffect.FridaDevice) => Effect.Effect<Frida.Session, Cause.UnknownException, Scope.Scope>,
    // Data-first signature.
    (
        device: FridaEffect.FridaDevice,
        target: Frida.TargetProcess,
        options?: Frida.SessionOptions | undefined
    ) => Effect.Effect<Frida.Session, Cause.UnknownException, Scope.Scope>
>(
    (arguments_) => isFridaDevice(arguments_[0]),
    (device: FridaEffect.FridaDevice, target: Frida.TargetProcess, options) =>
        Effect.acquireRelease(
            Effect.tryPromise(() => device.underlying.attach(target, options)),
            (session) => Effect.promise(() => session.detach())
        )
);

/** @internal */
export const acquireUsbDevice = (
    options?: Frida.GetDeviceOptions | undefined
): Effect.Effect<FridaEffect.FridaDevice, Cause.UnknownException, never> =>
    Effect.map(
        Effect.tryPromise(() => Frida.getUsbDevice(options)),
        (device) => ({ underlying: device, [FridaDeviceTypeId]: FridaDeviceTypeId }) as const
    );

/** @internal */
export const acquireRemoteDevice = (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
): Effect.Effect<FridaEffect.FridaDevice, Cause.UnknownException, never> =>
    Effect.map(
        Effect.tryPromise(() => Frida.getDeviceManager().addRemoteDevice(address, options)),
        (device) => ({ underlying: device, [FridaDeviceTypeId]: FridaDeviceTypeId }) as const
    );

/** @internal */
export const acquireLocalDevice = (): Effect.Effect<FridaEffect.FridaDevice, Cause.UnknownException, never> =>
    Effect.map(
        Effect.tryPromise(() => Frida.getLocalDevice()),
        (device) => ({ underlying: device, [FridaDeviceTypeId]: FridaDeviceTypeId }) as const
    );

/** @internal */
export const releaseDevice = (_device: FridaEffect.FridaDevice) => Effect.void;

/** @internal */
export const RemoteDeviceLayer = (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
): Layer.Layer<FridaEffect.FridaDevice, Cause.UnknownException, never> =>
    Layer.scoped(Tag, Effect.acquireRelease(acquireRemoteDevice(address, options), releaseDevice));

/** @internal */
export const UsbDeviceLayer = (
    options?: Frida.GetDeviceOptions | undefined
): Layer.Layer<FridaEffect.FridaDevice, Cause.UnknownException, never> =>
    Layer.scoped(Tag, Effect.acquireRelease(acquireUsbDevice(options), releaseDevice));

/** @internal */
export const LocalDeviceLayer = (): Layer.Layer<FridaEffect.FridaDevice, Cause.UnknownException, never> =>
    Layer.scoped(Tag, Effect.acquireRelease(acquireLocalDevice(), releaseDevice));
