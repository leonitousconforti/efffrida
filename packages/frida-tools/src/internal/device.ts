import type * as PlatformError from "effect/PlatformError";
import type * as Scope from "effect/Scope";

import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import * as String from "effect/String";
import * as Tuple from "effect/Tuple";
import * as ChildProcess from "effect/unstable/process/ChildProcess";
import * as ChildProcessSpawner from "effect/unstable/process/ChildProcessSpawner";

import type * as FridaDevice from "../FridaDevice.ts";

import * as Frida from "frida";

import * as FridaDeviceAcquisitionError from "../FridaDeviceAcquisitionError.ts";

/** @internal */
export const FridaDeviceTypeId: FridaDevice.FridaDeviceTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaDevice"
) as FridaDevice.FridaDeviceTypeId;

/** @internal */
export const Tag = Context.Service<FridaDevice.FridaDevice>("@efffrida/frida-tools/FridaDevice");

/** @internal */
export const isFridaDevice = (u: unknown): u is FridaDevice.FridaDevice => Predicate.hasProperty(u, FridaDeviceTypeId);

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
                return Frida.getLocalDevice(cancellable);
            },
            catch: (cause) =>
                new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                    acquisitionMethod: "local",
                    attempts: 1,
                    cause,
                }),
        }),
        (device) =>
            ({
                device,
                host: "local://",
                [FridaDeviceTypeId]: FridaDeviceTypeId,
            }) as const
    );

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
                    acquisitionMethod: "usb",
                    attempts: 1,
                    cause,
                }),
        }),
        (device) =>
            ({
                device,
                host: "usb://",
                [FridaDeviceTypeId]: FridaDeviceTypeId,
            }) as const
    );

/** @internal */
export const acquireRemoteDevice = (
    address: string,
    options?: Frida.RemoteDeviceOptions | undefined
): Effect.Effect<FridaDevice.FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, Scope.Scope> => {
    const acquire = Effect.tryPromise({
        try: (signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            return Frida.getDeviceManager().addRemoteDevice(address, options, cancellable);
        },
        catch: (cause) =>
            new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                acquisitionMethod: "remote",
                attempts: 1,
                cause,
            }),
    });

    const release = (_device: Frida.Device) =>
        Effect.promise((signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            return Frida.getDeviceManager().removeRemoteDevice(address, cancellable);
        });

    const resource = Effect.acquireRelease(acquire, release);

    return Effect.map(
        resource,
        (device) =>
            ({
                device,
                host: `remote://${address}`,
                [FridaDeviceTypeId]: FridaDeviceTypeId,
            }) as const
    );
};

/** @internal */
export const acquireAndroidEmulatorDevice = Effect.fn("acquireAndroidEmulatorDevice")(
    function* (
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
    ): Effect.fn.Return<
        FridaDevice.FridaDevice,
        PlatformError.PlatformError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
        ChildProcessSpawner.ChildProcessSpawner | Scope.Scope
    > {
        const hidden = options?.hidden ?? false;
        const adbExecutable = options?.adbExecutable ?? "adb";
        const emulatorExecutable = options?.emulatorExecutable ?? "emulator";
        const fridaExecutable = options?.fridaExecutable ?? "/data/local/tmp/frida-server";

        const net = yield* Effect.promise(() => import("node:net"));
        yield* Effect.annotateCurrentSpan({
            "emulator.name": name,
            "emulator.hidden": hidden,
            "adb.path": adbExecutable,
            "frida.path": fridaExecutable,
            "emulator.path": emulatorExecutable,
        });

        const getTwoConsecutiveFreePorts = (startingAt: number = 2000) =>
            Effect.callback<readonly [firstPort: number, secondPort: number], never, never>((resume) => {
                const socket1 = net.createConnection(startingAt);
                const socket2 = net.createConnection(startingAt + 1);

                const cleanup = () => {
                    socket1.removeAllListeners();
                    socket2.removeAllListeners();
                    socket1.destroy();
                    socket2.destroy();
                };

                const onError = (error: NodeJS.ErrnoException) => {
                    cleanup();

                    if (error.code !== "ECONNREFUSED") {
                        resume(Effect.die("Failed to get two free consecutive ports"));
                    } else if (socket1.connecting === false && socket2.connecting === false) {
                        resume(Effect.succeed(Tuple.make(startingAt, startingAt + 1)));
                    }
                };

                const onConnect = () => {
                    cleanup();
                    resume(getTwoConsecutiveFreePorts(startingAt + 1));
                };

                socket1.once("error", onError);
                socket2.once("error", onError);
                socket1.once("connect", onConnect);
                socket2.once("connect", onConnect);
                return Effect.sync(() => cleanup());
            });

        const childProcessSpawner = yield* ChildProcessSpawner.ChildProcessSpawner;
        const filterExitOk = (code: number) => (code === 0 ? Effect.void : Effect.fail(code));

        const [firstPort, _secondPort] = yield* getTwoConsecutiveFreePorts();
        const emulator = `emulator-${firstPort}`;

        const emulatorProcess = yield* ChildProcess.make(emulatorExecutable, [
            `@${name}`,
            "-delay-adb",
            "-read-only",
            "-no-snapshot-save",
            "-port",
            firstPort.toString(),
            ...(hidden ? ["-no-window"] : []),
            ...(options?.extraEmulatorArgs ?? []),
        ]);

        yield* Effect.addFinalizer(() =>
            ChildProcess.make(adbExecutable, ["-s", emulator, "emu", "kill"]).pipe(
                childProcessSpawner.exitCode,
                Effect.flatMap(filterExitOk),
                Effect.orDie
            )
        );

        const isBootCompletedPredicate = Predicate.or(
            String.includes("Successfully loaded"),
            String.includes("Boot completed")
        );

        yield* emulatorProcess.stderr.pipe(Stream.runHead, Effect.forkScoped);
        yield* emulatorProcess.stdout.pipe(
            Stream.decodeText(),
            Stream.splitLines,
            Stream.takeUntil(isBootCompletedPredicate),
            Stream.runDrain
        );

        yield* ChildProcess.make(adbExecutable, ["-s", emulator, "wait-for-device"]).pipe(
            childProcessSpawner.exitCode,
            Effect.flatMap(filterExitOk),
            Effect.catchIf(
                Predicate.isNumber,
                (code) =>
                    new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                        cause: `ADB wait-for-device failed with exit code ${code}`,
                        acquisitionMethod: "android-emulator",
                        attempts: 1,
                    })
            )
        );

        yield* ChildProcess.make(adbExecutable, ["-s", emulator, "root"]).pipe(
            childProcessSpawner.exitCode,
            Effect.flatMap(filterExitOk),
            Effect.catchIf(
                Predicate.isNumber,
                (code) =>
                    new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                        cause: `ADB root failed with exit code ${code}`,
                        acquisitionMethod: "android-emulator",
                        attempts: 1,
                    })
            )
        );

        yield* ChildProcess.make(adbExecutable, ["-s", emulator, "shell", `"${fridaExecutable}"`]).pipe(
            Effect.andThen(Effect.sleep("3 seconds"))
        );

        const fridaPort = yield* ChildProcess.make(adbExecutable, [
            "-s",
            emulator,
            "forward",
            "tcp:0",
            "tcp:27042",
        ]).pipe(
            childProcessSpawner.string,
            Effect.flatMap(Schema.decodeEffect(Schema.NumberFromString)),
            Effect.catchTag(
                "SchemaError",
                (cause) =>
                    new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                        acquisitionMethod: "android-emulator",
                        attempts: 1,
                        cause,
                    })
            )
        );

        const { host: _host, ...remoteDevice } = yield* acquireRemoteDevice(`localhost:${fridaPort}`);

        return {
            ...remoteDevice,
            host: `android-emulator://${emulator}`,
        } as const;
    },
    Effect.timeoutOrElse({
        duration: "1 minute",
        orElse: () =>
            new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                cause: "Timeout while acquiring Android emulator device",
                acquisitionMethod: "android-emulator",
                attempts: 1,
            }),
    }),
    Effect.catchTag(
        "PlatformError",
        (cause) =>
            new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                acquisitionMethod: "android-emulator",
                attempts: 1,
                cause,
            })
    )
);

/** @internal */
export const acquireAndroidEmulatorDeviceConfig = (
    name: string,
    options?:
        | {
              hidden?: boolean | undefined;
              fridaExecutable?: string | undefined;
              extraEmulatorArgs?: Array<string> | undefined;
          }
        | undefined
): Effect.Effect<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError | Config.ConfigError,
    ChildProcessSpawner.ChildProcessSpawner | Path.Path | Scope.Scope
> =>
    Effect.flatMap(Path.Path, (path) =>
        Config.string("ANDROID_SDK").pipe(
            Config.map((androidSdk) => ({
                adbExecutable: path.join(androidSdk, "platform-tools", "adb"),
                emulatorExecutable: path.join(androidSdk, "emulator", "emulator"),
            })),
            // TODO: Should this be optional?
            Config.withDefault({
                adbExecutable: "adb",
                emulatorExecutable: "emulator",
            }),
            Effect.flatMap((androidSdk) =>
                acquireAndroidEmulatorDevice(name, {
                    ...androidSdk,
                    ...options,
                })
            )
        )
    );

/** @internal */
export const layerLocalDevice: Layer.Layer<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    never
> = Layer.effect(Tag, acquireLocalDevice());

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
export const layerAndroidEmulatorDevice = (
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
): Layer.Layer<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner
> => Layer.effect(Tag, acquireAndroidEmulatorDevice(name, options));

/** @internal */
export const layerAndroidEmulatorDeviceConfig = (
    name: string,
    options?:
        | {
              hidden?: boolean | undefined;
              fridaExecutable?: string | undefined;
              extraEmulatorArgs?: Array<string> | undefined;
          }
        | undefined
): Layer.Layer<
    FridaDevice.FridaDevice,
    Config.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner | Path.Path
> => Layer.effect(Tag, acquireAndroidEmulatorDeviceConfig(name, options));
