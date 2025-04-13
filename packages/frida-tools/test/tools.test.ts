import { expect, layer } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer, Option, Stream } from "effect";

const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const Live = Layer.provideMerge(SessionLive, DeviceLive).pipe(Layer.merge(NodeContext.layer));

layer(Live)("Local device tests", (it) => {
    it.scoped("should load a script", () =>
        Effect.gen(function* () {
            const source = yield* FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url));
            const script = yield* FridaScript.load(source);
            const message = yield* script.stream.pipe(Stream.runHead).pipe(Effect.map(Option.getOrThrow));
            expect(message).toStrictEqual({ message: "Hello from Frida!", data: Option.none() });
        })
    );
});
