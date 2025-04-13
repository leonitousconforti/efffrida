import { expect, layer } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer, Option, Stream } from "effect";
import { ScriptRuntime } from "frida";

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive);

// Compile the agent
const ScriptLive = FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url))
    .pipe(Effect.map(FridaScript.layer({ runtime: ScriptRuntime.V8 })))
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide([FridaLive, NodeContext.layer]));

layer(ScriptLive)("Local device tests", (it) => {
    it.scoped("should load a script", () =>
        Effect.gen(function* () {
            const script = yield* FridaScript.FridaScript;
            const message = yield* script.stream.pipe(Stream.runHead).pipe(Effect.map(Option.getOrThrow));
            expect(message).toStrictEqual({ message: "Hello from Frida!", data: Option.none() });
        })
    );
});
