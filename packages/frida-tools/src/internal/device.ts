import type * as PlatformError from "effect/PlatformError";
import type * as Scope from "effect/Scope";

import * as Cause from "effect/Cause";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Match from "effect/Match";
import * as Path from "effect/Path";
import * as Predicate from "effect/Predicate";
import * as ChildProcess from "effect/process/ChildProcess";
import * as ChildProcessSpawner from "effect/process/ChildProcessSpawner";
import * as Schedule from "effect/Schedule";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import * as String from "effect/String";
import * as Tuple from "effect/Tuple";

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
export const awaitReachable = (
    timeout: Duration.Input = "30 seconds"
): Effect.Effect<void, Cause.TimeoutError, FridaDevice.FridaDevice> =>
    Effect.flatMap(Tag, ({ device }) => {
        // Kept for the timeout, so that a device that never answers, e.g.
        // because its frida-server is incompatible, says why
        let lastError: string | undefined;
        return Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return device.querySystemParameters(cancellable);
            },
            catch: (cause) => {
                lastError = cause instanceof Error ? cause.message : globalThis.String(cause);
                return lastError;
            },
        }).pipe(
            Effect.tapError(() => Effect.sleep("250 millis")),
            Effect.eventually,
            Effect.asVoid,
            Effect.timeoutOrElse({
                duration: timeout,
                orElse: () =>
                    new Cause.TimeoutError(
                        lastError === undefined
                            ? "The device did not answer"
                            : `The device did not answer, last error: ${lastError}`
                    ),
            })
        );
    });

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

    // Finalizers are uninterruptible, so a call that never settles would block
    // every finalizer after it (e.g. stopping frida-server and the emulator)
    const release = (_device: Frida.Device) =>
        Effect.tryPromise((signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            return Frida.getDeviceManager().removeRemoteDevice(address, cancellable);
        }).pipe(
            Effect.timeoutOrElse({
                duration: "10 seconds",
                orElse: () => Effect.logWarning(`Timed out removing remote device ${address}`),
            }),
            Effect.ignore
        );

    // Acquire interruptibly so that interrupting (e.g. the emulator timeout)
    // aborts the signal and cancels the connection attempt
    const resource = Effect.acquireRelease(acquire, release, { interruptible: true });

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
                  extraEmulatorArgs?: ReadonlyArray<string> | undefined;
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

                let refused = 0;
                const onError = (error: NodeJS.ErrnoException) => {
                    if (error.code !== "ECONNREFUSED") {
                        cleanup();
                        resume(Effect.die("Failed to get two free consecutive ports"));
                    } else if (++refused === 2) {
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

        const childProcessSpawner = yield* ChildProcessSpawner.ChildProcessSpawner;
        const filterExitOk = (code: number) => (code === 0 ? Effect.void : Effect.fail(code));

        const [firstPort, _secondPort] = yield* getTwoConsecutiveFreePorts();
        const emulator = `emulator-${firstPort}`;

        // Nothing reads stderr, so leaving it piped would eventually block the
        // emulator once the pipe buffer fills up. The emu kill finalizer below
        // normally stops the emulator, otherwise it gets SIGTERM and then
        // SIGKILL
        const emulatorProcess = yield* ChildProcess.make(
            emulatorExecutable,
            [
                `@${name}`,
                "-delay-adb",
                "-read-only",
                "-no-snapshot-save",
                "-port",
                firstPort.toString(),
                ...(hidden ? ["-no-window"] : []),
                ...(options?.extraEmulatorArgs ?? []),
            ],
            { stderr: "ignore", forceKillAfter: "30 seconds" }
        );

        yield* Effect.addFinalizer(() =>
            ChildProcess.make(adbExecutable, ["-s", emulator, "emu", "kill"]).pipe(
                childProcessSpawner.exitCode,
                Effect.timeout("30 seconds"),
                Effect.flatMap(filterExitOk),
                Effect.orDie
            )
        );

        const isBootCompletedPredicate = Predicate.or(
            String.includes("Successfully loaded"),
            String.includes("Boot completed")
        );

        // Keep draining stdout for the lifetime of the emulator, not just until
        // boot completes, otherwise the emulator blocks once the pipe buffer
        // fills up
        const bootCompleted = yield* Deferred.make<void, PlatformError.PlatformError>();
        yield* emulatorProcess.stdout.pipe(
            Stream.decodeText(),
            Stream.splitLines,
            Stream.runForEach((line) =>
                isBootCompletedPredicate(line) ? Deferred.succeed(bootCompleted, undefined) : Effect.void
            ),
            Effect.exit,
            Effect.flatMap((exit) => Deferred.done(bootCompleted, exit)),
            Effect.forkScoped
        );

        yield* Deferred.await(bootCompleted);
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

        // frida-server watches for crashes with a `logcat -b crash -B` that
        // inherits frida-server's stdin, and adb shell connects stdin and stdout
        // to the same socket. When frida-server dies, the orphaned logcat keeps
        // that socket open and adb shell never returns, so frida-server gets
        // /dev/null as stdin. The redirect can go once the frida-server versions
        // in use have the fix for
        // https://github.com/frida/frida-core/issues/1288
        //
        // Nothing reads the output, so leaving it piped would eventually block
        // frida-server once the pipe buffer fills up
        const fridaServer = ChildProcess.make(
            adbExecutable,
            ["-s", emulator, "shell", `"${fridaExecutable}" </dev/null`],
            { stdout: "ignore", stderr: "ignore", forceKillAfter: "5 seconds" }
        );

        // Restart frida-server when it exits, e.g. when it crashes, at most 5
        // times over the life of the device. The remote device below reconnects
        // on its own, but sessions on the old server detach with
        // "connection-terminated" and have to be created again
        yield* childProcessSpawner.exitCode(fridaServer).pipe(
            Effect.flatMap((code) => Effect.logWarning(`frida-server exited with code ${code}`)),
            Effect.repeat({ schedule: Schedule.spaced("1 second"), times: 5 }),
            Effect.flatMap(() => Effect.logError("frida-server keeps exiting, giving up on restarting it")),
            Effect.catch((error) => Effect.logError("Failed to run frida-server", error)),
            Effect.forkScoped
        );
        yield* Effect.sleep("3 seconds");

        const fridaPort = yield* ChildProcess.make(adbExecutable, [
            "-s",
            emulator,
            "forward",
            "tcp:0",
            "tcp:27042",
        ]).pipe(
            childProcessSpawner.string,
            Effect.flatMap(Schema.decodeEffect(Schema.FiniteFromString)),
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
              extraEmulatorArgs?: ReadonlyArray<string> | undefined;
          }
        | undefined
): Effect.Effect<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError | Config.ConfigError,
    ChildProcessSpawner.ChildProcessSpawner | Path.Path | Scope.Scope
> =>
    Effect.flatMap(Path.Path, (path) =>
        Config.String("ANDROID_HOME").pipe(
            Config.map((androidHome) => ({
                adbExecutable: path.join(androidHome, "platform-tools", "adb"),
                emulatorExecutable: path.join(androidHome, "emulator", "emulator"),
            })),
            // Fall back to resolving the executables from the PATH
            Config.withDefault({
                adbExecutable: "adb",
                emulatorExecutable: "emulator",
            }),
            Effect.flatMap((executables) =>
                acquireAndroidEmulatorDevice(name, {
                    ...executables,
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
              extraEmulatorArgs?: ReadonlyArray<string> | undefined;
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
              extraEmulatorArgs?: ReadonlyArray<string> | undefined;
          }
        | undefined
): Layer.Layer<
    FridaDevice.FridaDevice,
    Config.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner | Path.Path
> => Layer.effect(Tag, acquireAndroidEmulatorDeviceConfig(name, options));

/** @internal */
export const DeviceSchema: Schema.Union<
    readonly [
        Schema.Struct<{
            readonly connection: Schema.Literal<"local">;
        }>,
        Schema.Struct<{
            readonly connection: Schema.Literal<"usb">;
            readonly timeout: Schema.optional<Schema.DurationFromMillis>;
        }>,
        Schema.Struct<{
            readonly address: Schema.String;
            readonly connection: Schema.Literal<"remote">;
            readonly token: Schema.optional<Schema.String>;
            readonly origin: Schema.optional<Schema.String>;
            readonly keepaliveInterval: Schema.optional<Schema.DurationFromMillis>;
        }>,
        Schema.Struct<{
            readonly emulatorName: Schema.String;
            readonly hidden: Schema.optional<Schema.Boolean>;
            readonly adbExecutable: Schema.optional<Schema.String>;
            readonly connection: Schema.Literal<"android-emulator">;
            readonly fridaExecutable: Schema.optional<Schema.String>;
            readonly emulatorExecutable: Schema.optional<Schema.String>;
            readonly extraEmulatorArgs: Schema.optional<Schema.$Array<Schema.String>>;
        }>,
    ]
> = Schema.Union([
    Schema.Struct({
        connection: Schema.Literal("local"),
    }),
    Schema.Struct({
        connection: Schema.Literal("usb"),
        timeout: Schema.optional(Schema.DurationFromMillis),
    }),
    Schema.Struct({
        address: Schema.String,
        connection: Schema.Literal("remote"),
        token: Schema.optional(Schema.String),
        origin: Schema.optional(Schema.String),
        keepaliveInterval: Schema.optional(Schema.DurationFromMillis),
    }),
    Schema.Struct({
        emulatorName: Schema.String,
        hidden: Schema.optional(Schema.Boolean),
        adbExecutable: Schema.optional(Schema.String),
        connection: Schema.Literal("android-emulator"),
        fridaExecutable: Schema.optional(Schema.String),
        emulatorExecutable: Schema.optional(Schema.String),
        extraEmulatorArgs: Schema.optional(Schema.Array(Schema.String)),
    }),
]);

/** @internal */
export const DeviceLive = (
    config: Schema.Schema.Type<typeof DeviceSchema>
): Layer.Layer<
    FridaDevice.FridaDevice,
    FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
    ChildProcessSpawner.ChildProcessSpawner
> =>
    Match.value(config).pipe(
        Match.when({ connection: "local" }, () => layerLocalDevice),
        Match.when({ connection: "usb" }, ({ timeout }) =>
            layerUsbDevice(timeout !== undefined ? { timeout: Duration.toMillis(timeout) } : {})
        ),
        Match.when({ connection: "remote" }, ({ address, keepaliveInterval, origin, token }) =>
            layerRemoteDevice(address, {
                ...(token !== undefined ? { token } : {}),
                ...(origin !== undefined ? { origin } : {}),
                ...(keepaliveInterval !== undefined ? { keepaliveInterval: Duration.toMillis(keepaliveInterval) } : {}),
            })
        ),
        Match.when(
            { connection: "android-emulator" },
            ({ adbExecutable, emulatorExecutable, emulatorName, extraEmulatorArgs, fridaExecutable, hidden }) =>
                layerAndroidEmulatorDevice(emulatorName, {
                    hidden,
                    adbExecutable,
                    fridaExecutable,
                    emulatorExecutable,
                    extraEmulatorArgs,
                })
        ),
        Match.exhaustive
    );
