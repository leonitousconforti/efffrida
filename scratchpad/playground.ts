import { Context, Effect, Layer, pipe, Stream, String, Tuple, References, Duration } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import { NodeServices, NodeRuntime, NodeHttpClient } from "@effect/platform-node";
import { FridaDevice, FridaDeviceAcquisitionError, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { GooglePlayApi } from "@efffrida/gplayapi";

const DeviceLive = pipe(
    FridaDevice.layerAndroidEmulatorDeviceConfig("Small_Phone", {
        fridaExecutable: "/data/local/tmp/frida-server-17.11.0-android-arm64",
        extraEmulatorArgs: ["-gpu", "swiftshader_indirect"],
    }),
    Layer.tap(
        Effect.fnUntraced(
            function* (deviceCtx: Context.Context<FridaDevice.FridaDevice>) {
                const device = Context.get(deviceCtx, FridaDevice.FridaDevice);
                const emulatorName = String.replace("android-emulator://", "")(device.host);
                const childProcessSpawner = yield* ChildProcessSpawner.ChildProcessSpawner;
                const apks = yield* GooglePlayApi.downloadToDisk("com.nimblebit.tinytower");

                yield* Effect.annotateCurrentSpan({
                    "apk.path": apks,
                    "emulator.name": emulatorName,
                });

                const installCommand = ChildProcess.make("/Users/leo.conforti/Library/Android/sdk/platform-tools/adb", [
                    "-s",
                    emulatorName,
                    "install-multiple",
                    "-r", // Replace existing application (if present)
                    "-t", // Allow test packages
                    "-g", // Grant all runtime permissions
                    "-d", // Allow downgrade
                    ...apks.map((apk) => apk.file),
                ]);

                const exitCode = yield* childProcessSpawner.exitCode(installCommand);
                if (exitCode !== 0) {
                    return yield* new FridaDeviceAcquisitionError.FridaDeviceAcquisitionError({
                        cause: `Failed to install APK. Exit code: ${exitCode}`,
                        acquisitionMethod: "android-emulator",
                        attempts: 1,
                    });
                }
            },
            Effect.scoped,
            Effect.timed,
            Effect.map(Tuple.get(0)),
            Effect.map(Duration.toSeconds),
            Effect.flatMap((time) => Effect.logDebug(`APK downloading and installing took ${time} seconds`)),
            Effect.asVoid
        )
    ),
    Layer.provide(GooglePlayApi.AndroidDevice.EmbeddedPixel7aLive),
    Layer.provide(NodeHttpClient.layerFetch),
    Layer.provide(NodeServices.layer)
);

const SessionLive = Layer.provide(FridaSession.layer("com.nimblebit.tinytower"), DeviceLive);

Effect.gen(function* () {
    const script = yield* FridaScript.FridaScript;
    const firstMessage = yield* Stream.runHead(script.stream);
    yield* Effect.log(firstMessage);
}).pipe(
    Effect.timeout("30 seconds"),
    FridaScript.watch(new URL("agent.ts", import.meta.url)),
    Stream.provide(Layer.merge(SessionLive, NodeServices.layer)),
    Stream.provideService(References.MinimumLogLevel, "Debug"),
    FridaScript.logWatchErrors,
    Stream.runDrain,
    NodeRuntime.runMain
);
