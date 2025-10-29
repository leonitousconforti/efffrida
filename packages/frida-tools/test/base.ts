import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer } from "effect";

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "infinity");
        const process = yield* executor.start(command);
        const pid = process.pid;
        return FridaSession.layer(pid, { persistTimeout: 1 });
    })
);

export const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));
