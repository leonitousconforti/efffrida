import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const program = Effect.gen(function* () {
    yield* Effect.log("Connecting to agent...");
    // Use FridaScript to communicate with the agent package
});

const MainLive = FridaScript.layer({}).pipe(
    Layer.provide(FridaSession.layer(["sleep", "infinity"])),
    Layer.provide(FridaDevice.layerLocalDevice),
    Layer.provideMerge(NodeServices.layer)
);

NodeRuntime.runMain(Effect.provide(program, MainLive));
