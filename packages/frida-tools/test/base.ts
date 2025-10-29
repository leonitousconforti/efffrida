import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";
import { Duration, Effect, Layer, Schedule } from "effect";

// For GitHub Actions 🤮
const retryPolicy = Schedule.addDelay(Schedule.recurs(2), () => Duration.seconds(1));

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "infinity");
        const process = yield* executor.start(command);
        const pid = process.pid;
        return FridaSession.layer(pid);
    })
).pipe(Layer.retry(retryPolicy));

export const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));
