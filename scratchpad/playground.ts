import { Context, Effect, Layer, pipe, Stream, String, Tuple, References } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import { NodeServices, NodeRuntime, NodeHttpClient } from "@effect/platform-node";
import { FridaDevice, FridaDeviceAcquisitionError, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { GooglePlayApi } from "@efffrida/gplayapi";

const DeviceLive = pipe(
    FridaDevice.layerAndroidEmulatorDeviceConfig("Small_Phone", {
        fridaExecutable: "/data/local/tmp/frida-server-17.9.8-android-arm64",
        extraEmulatorArgs: ["-gpu", "swiftshader_indirect"],
    }),
    Layer.tap(
        Effect.fnUntraced(
            function* (deviceCtx: Context.Context<FridaDevice.FridaDevice>) {
                const device = Context.get(deviceCtx, FridaDevice.FridaDevice);
                const emulatorName = String.replace("android-emulator://", "")(device.host);
                const childProcessSpawner = yield* ChildProcessSpawner.ChildProcessSpawner;

                const androidDevice = yield* GooglePlayApi.AndroidDevice.EmbeddedPixel7a;
                const apks = yield* GooglePlayApi.download(androidDevice, "com.nimblebit.tinytower");

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
            Effect.map(Tuple.get(1)),
            Effect.flatMap((time) => Effect.logDebug(`APK downloading and installing took ${time}`)),
            Effect.asVoid
        )
    ),
    Layer.provide(NodeServices.layer),
    Layer.provide(NodeHttpClient.layerFetch)
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
    .pipe(Effect.provideService(References.MinimumLogLevel, "Debug"))
    .pipe(NodeRuntime.runMain);
