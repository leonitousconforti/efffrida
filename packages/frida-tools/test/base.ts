import { Layer } from "effect";

import { NodeServices } from "@effect/platform-node";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";

export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive =
    process.env.CI !== undefined
        ? FridaSession.layer(["/usr/bin/sleep", "infinity"])
        : FridaSession.SessionLive({ preSpawn: true, spawn: ["sleep", "infinity"] });

export const FridaLive = SessionLive.pipe(
    Layer.provide(NodeServices.layer),
    Layer.provide(DeviceLive),
    Layer.satisfiesSuccessType<FridaSession.FridaSession>()
);
