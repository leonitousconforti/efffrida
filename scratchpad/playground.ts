import { Command } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { FridaDevice, FridaDeviceAcquisitionError, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { GooglePlayApi } from "@efffrida/gplayapi";
import { Cause, Effect, Layer, Logger, LogLevel, pipe, Schedule, Stream, String, Tuple } from "effect";

const DeviceLive = pipe(
    Effect.retryOrElse(
        FridaDevice.acquireAndroidEmulatorDevice("Small_Phone", {
            fridaExecutable: "/data/local/tmp/frida-server-17.5.1-android-arm64",
            adbExecutable: "/Users/leo.conforti/Library/Android/sdk/platform-tools/adb",
            emulatorExecutable: "/Users/leo.conforti/Library/Android/sdk/emulator/emulator",
        }),
        Schedule.recurs(0).pipe(Schedule.addDelay(() => "1 second")),
        (error, attempts) =>
            new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                cause: error.cause,
                attempts: attempts + 1,
                acquisitionMethod: "android-emulator",
            })
    ),
    Effect.tap(
        Effect.fnUntraced(
            function* (device) {
                const emulatorName = String.replace("android-emulator://", "")(device.host);
                const apks = yield* Effect.provide(
                    GooglePlayApi.download("com.nimblebit.tinytower"),
                    GooglePlayApi.defaultHttpClient
                );

                yield* Effect.annotateCurrentSpan({
                    "apk.path": apks,
                    "emulator.name": emulatorName,
                });

                const installCommand = Command.make(
                    "/Users/leo.conforti/Library/Android/sdk/platform-tools/adb",
                    "-s",
                    emulatorName,
                    "install-multiple",
                    "-r", // Replace existing application (if present)
                    "-t", // Allow test packages
                    "-g", // Grant all runtime permissions
                    "-d", // Allow downgrade
                    ...apks.map((apk) => apk.file)
                );

                const exitCode = yield* Command.exitCode(installCommand);
                if (exitCode !== 0) {
                    return yield* new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                        attempts: 1,
                        acquisitionMethod: "android-emulator",
                        cause: new Cause.RuntimeException(`Failed to install APK. Exit code: ${exitCode}`),
                    });
                }
            },
            Effect.scoped,
            Effect.timed,
            Effect.map(Tuple.getFirst),
            Effect.flatMap((time) => Effect.logDebug(`APK downloading and installing took ${time}`)),
            Effect.asVoid
        )
    ),
    Layer.scoped(FridaDevice.FridaDevice),
    Layer.provide(NodeContext.layer)
);

const SessionLive = Layer.provide(FridaSession.layer("com.nimblebit.tinytower"), DeviceLive);
const ScriptLive = Layer.provide(FridaScript.layer(new URL("agent.ts", import.meta.url)), SessionLive);

Effect.gen(function* () {
    const script = yield* FridaScript.FridaScript;
    const firstMessage = yield* Stream.runHead(script.stream);
    yield* Effect.log(firstMessage);
    yield* Effect.sleep("30 seconds");
})
    .pipe(Effect.provide(ScriptLive))
    .pipe(Effect.provide(Logger.minimumLogLevel(LogLevel.Debug)))
    .pipe(NodeRuntime.runMain);
