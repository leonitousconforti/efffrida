import type * as CommandExecutor from "@effect/platform/CommandExecutor";
import type * as ConfigError from "effect/ConfigError";
import type * as Scope from "effect/Scope";
import type * as FridaDevice from "../FridaDevice.ts";

import * as Command from "@effect/platform/Command";
import * as PlatformError from "@effect/platform/Error";
import * as Chunk from "effect/Chunk";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ParseResult from "effect/ParseResult";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import * as String from "effect/String";
import * as Tuple from "effect/Tuple";
import * as Frida from "frida";
import * as net from "node:net";
import * as path from "node:path";

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
                    cause,
                    attempts: 1,
                    acquisitionMethod: "local",
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
                    cause,
                    attempts: 1,
                    acquisitionMethod: "usb",
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
                cause,
                attempts: 1,
                acquisitionMethod: "remote",
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
        ParseResult.ParseError | PlatformError.PlatformError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
        CommandExecutor.CommandExecutor | Scope.Scope
    > {
        const hidden = options?.hidden ?? false;
        const adbExecutable = options?.adbExecutable ?? "adb";
        const emulatorExecutable = options?.emulatorExecutable ?? "emulator";
        const fridaExecutable = options?.fridaExecutable ?? "/data/local/tmp/frida-server";

        yield* Effect.annotateCurrentSpan({
            "emulator.name": name,
            "emulator.hidden": hidden,
            "adb.path": adbExecutable,
            "frida.path": fridaExecutable,
            "emulator.path": emulatorExecutable,
        });

        const getTwoConsecutiveFreePorts = (startingAt: number = 2000) =>
            Effect.async<readonly [firstPort: number, secondPort: number], never, never>((resume) => {
                const socket1 = net.createConnection(startingAt);
                const socket2 = net.createConnection(startingAt + 1);

                const cleanup = () => {
                    socket1.removeAllListeners();
                    socket2.removeAllListeners();
                    socket1.destroy();
                    socket2.destroy();
                };

                const onError = (error: NodeJS.ErrnoException) => {
                    if (error.code !== "ECONNREFUSED") {
                        resume(Effect.dieMessage("Failed to get two free consecutive ports"));
                    }

                    if (socket1.connecting === false && socket2.connecting === false) {
                        cleanup();
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

        const filterExitOk = (code: number) => (code === 0 ? Effect.void : Effect.fail(code));

        const [firstPort, _secondPort] = yield* getTwoConsecutiveFreePorts();
        const emulator = `emulator-${firstPort}`;

        const emulatorProcess = yield* Command.make(
            emulatorExecutable,
            `@${name}`,
            "-delay-adb",
            "-read-only",
            "-no-snapshot-save",
            "-port",
            firstPort.toString(),
            ...(hidden ? ["-no-window"] : []),
            ...(options?.extraEmulatorArgs ?? [])
        ).pipe(Command.start);

        yield* Effect.addFinalizer(() =>
            Command.make(adbExecutable, "-s", emulator, "emu", "kill")
                .pipe(Command.exitCode)
                .pipe(Effect.flatMap(filterExitOk))
                .pipe(Effect.orDie)
        );

        const isBootCompletedPredicate = Predicate.or(
            String.includes("Successfully loaded"),
            String.includes("Boot completed")
        );

        const decoder = new TextDecoder();
        yield* emulatorProcess.stderr.pipe(Stream.runHead).pipe(Effect.forkScoped);
        yield* emulatorProcess.stdout
            .pipe(Stream.mapChunks(Chunk.map((bytes) => decoder.decode(bytes))))
            .pipe(Stream.splitLines)
            .pipe(Stream.takeUntil(isBootCompletedPredicate))
            .pipe(Stream.runDrain);

        yield* Command.make(adbExecutable, `-s`, emulator, "wait-for-device")
            .pipe(Command.exitCode)
            .pipe(Effect.flatMap(filterExitOk))
            .pipe(
                Effect.mapError(
                    (code) =>
                        new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                            attempts: 1,
                            acquisitionMethod: "android-emulator",
                            cause: `ADB wait-for-device failed with exit code ${code}`,
                        })
                )
            );

        yield* Command.make(adbExecutable, `-s`, emulator, "root")
            .pipe(Command.exitCode)
            .pipe(Effect.flatMap(filterExitOk))
            .pipe(
                Effect.mapError(
                    (code) =>
                        new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                            attempts: 1,
                            acquisitionMethod: "android-emulator",
                            cause: `ADB root failed with exit code ${code}`,
                        })
                )
            );

        yield* Command.make(adbExecutable, "-s", emulator, "shell", `"${fridaExecutable}"`)
            .pipe(Command.start)
            .pipe(Effect.andThen(Effect.sleep("3 seconds")));

        const fridaPort = yield* Command.make(adbExecutable, "-s", emulator, "forward", "tcp:0", "tcp:27042")
            .pipe(Command.string)
            .pipe(Effect.flatMap(Schema.decode(Schema.NumberFromString)));

        const { host: _host, ...remoteDevice } = yield* acquireRemoteDevice(`localhost:${fridaPort}`);

        return {
            ...remoteDevice,
            host: `android-emulator://${emulator}`,
        } as const;
    },
    Effect.timeoutFail({
        duration: "1 minute",
        onTimeout: () =>
            new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                attempts: 1,
                acquisitionMethod: "android-emulator",
                cause: "Timeout while acquiring Android emulator device",
            }),
    }),
    Effect.catchIf(
        Predicate.or(PlatformError.isPlatformError, ParseResult.isParseError),
        (cause) =>
            new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                cause,
                attempts: 1,
                acquisitionMethod: "android-emulator",
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
) =>
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
    Layer.scoped(Tag, acquireRemoteDevice(address, options));

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
    CommandExecutor.CommandExecutor
> => Layer.scoped(Tag, acquireAndroidEmulatorDevice(name, options));

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
    ConfigError.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    CommandExecutor.CommandExecutor
> => Layer.scoped(Tag, acquireAndroidEmulatorDeviceConfig(name, options));
