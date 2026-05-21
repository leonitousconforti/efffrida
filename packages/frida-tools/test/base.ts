import { Effect, Layer } from "effect";
import { ChildProcess } from "effect/unstable/process";

import { NodeServices } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";

export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive =
    process.env.CI !== undefined
        ? FridaSession.layer(["/usr/bin/sleep", "infinity"])
        : ChildProcess.make`sleep infinity`.pipe(
              Effect.tap(Effect.sleep("1 seconds")),
              Effect.map((handle) => FridaSession.layer(handle.pid)),
              Layer.unwrap
          );

export const FridaLive = SessionLive.pipe(
    Layer.provide(NodeServices.layer),
    Layer.provide(DeviceLive),
    Layer.satisfiesSuccessType<FridaSession.FridaSession>()
);
