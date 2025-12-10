import { FridaDevice, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer, Scope } from "effect";
import { spawn } from "node:child_process";

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const scope = yield* Scope.Scope;

        // Use raw Node.js child_process to spawn
        const child = spawn("sleep", ["infinity"], {
            detached: false,
            stdio: "ignore",
        });

        // Kill the process when scope closes
        yield* Scope.addFinalizer(
            scope,
            Effect.sync(() => child.kill())
        );

        return FridaSession.layer(child.pid!);
    })
);

export const FridaLive = Layer.provide(SessionLive, DeviceLive);
