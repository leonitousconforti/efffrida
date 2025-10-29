import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";
import { Duration, Effect, Layer, Schedule } from "effect";

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "infinity");
        const process = yield* executor.start(command);
        const pid = process.pid;

        // For GitHub Actions 🤮
        return Layer.retry(
            FridaSession.layer(pid),
            Schedule.addDelay(Schedule.recurs(2), () => Duration.seconds(1))
        );
    })
);

export const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));
