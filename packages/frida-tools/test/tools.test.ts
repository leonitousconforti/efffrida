import { expect, layer } from "@effect/vitest";

import { Path } from "@effect/platform";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer, Option, Stream } from "effect";

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive).pipe(Layer.merge(Path.layer));

const Script1Live = FridaScript.layer(new URL("../frida/agent1/main.ts", import.meta.url));
const Script2Live = FridaScript.layer(new URL("../frida/agent2/main.ts", import.meta.url));
const Script3Live = FridaScript.layer(new URL("../frida/agent3/main.ts", import.meta.url));
const Script4Live = FridaScript.layer(new URL("../frida/agent4/effect.ts", import.meta.url));

layer(FridaLive)("local device tests", (it) => {
    it.layer(Script1Live)((it) => {
        it.scoped("agent1 on local device", () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const firstMessage = yield* script.stream.pipe(Stream.runHead);
                expect(firstMessage).toStrictEqual(Option.some({ message: "Hello from Frida0!", data: Option.none() }));
            })
        );
    });

    it.layer(Script2Live)((it) => {
        it.scoped("agent2 on local device", () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const firstMessage = yield* script.stream.pipe(Stream.runHead);
                expect(firstMessage).toStrictEqual(
                    Option.some({ message: "Hello from Frida other->A", data: Option.none() })
                );
            })
        );
    });

    it.layer(Script3Live)((it) => {
        it.scoped("agent3 on local device", () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const firstMessage = yield* script.stream.pipe(Stream.runHead);
                expect(firstMessage).toStrictEqual(
                    Option.some({ message: "Hello from Frida! other->A another->A another->B", data: Option.none() })
                );
            })
        );
    });

    it.layer(Script4Live)((it) => {
        it.scoped("agent4 on local device", () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const firstMessage = yield* script.stream.pipe(Stream.runHead);
                expect(firstMessage).toStrictEqual(Option.some({ message: "Hello from Effect!", data: Option.none() }));
            })
        );
    });
});
