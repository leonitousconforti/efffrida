import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";

import { Effect, Layer } from "effect";

export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive =
    process.env.CI !== undefined
        ? FridaSession.layer(["/usr/bin/sleep", "infinity"])
        : Layer.unwrapScoped(
              Effect.gen(function* () {
                  const executor = yield* CommandExecutor.CommandExecutor;
                  const command = Command.make("sleep", "infinity");
                  const proc = yield* executor.start(command);
                  return FridaSession.layer(proc.pid);
              })
          ).pipe(Layer.provide(NodeContext.layer));

export const FridaLive = Layer.fresh(SessionLive).pipe(Layer.provide(DeviceLive));
