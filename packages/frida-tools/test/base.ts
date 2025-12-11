import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";
import { Duration, Effect, Layer, Schedule } from "effect";

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;

// For nix 😍
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "infinity");
        const proc = yield* executor.start(command);

        // For GitHub Actions 🤮
        if (process.env.CI !== undefined) {
            return Layer.retry(
                FridaSession.layer(proc.pid),
                Schedule.addDelay(Schedule.recurs(2), () => Duration.seconds(1))
            );
        }

        return FridaSession.layer(proc.pid);
    })
);

export const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));
