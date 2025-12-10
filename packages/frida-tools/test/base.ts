import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer } from "effect";

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        if ("CI" in process.env) {
            return FridaSession.layer(["/usr/bin/sleep", "infinity"]);
        }

        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "infinity");
        const proc = yield* executor.start(command);
        return FridaSession.layer(proc.pid);
    })
);

export const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));
