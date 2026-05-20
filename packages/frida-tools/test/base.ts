import { Effect, Layer } from "effect";
import { ChildProcess } from "effect/unstable/process";

import { NodeServices } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";

export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive =
    process.env.CI !== undefined
        ? FridaSession.layer(["/usr/bin/sleep", "10"])
        : ChildProcess.make`sleep infinity`.pipe(
              Effect.map((handle) => FridaSession.layer(handle.pid)),
              Layer.unwrap
          );

export const FridaLive = SessionLive.pipe(
    Layer.fresh,
    Layer.provide(NodeServices.layer),
    Layer.provide(DeviceLive),
    Layer.satisfiesSuccessType<FridaSession.FridaSession>()
);
