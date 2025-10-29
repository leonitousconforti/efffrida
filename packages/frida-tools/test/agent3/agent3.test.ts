import { expect, layer } from "@effect/vitest";
import { FridaScript } from "@efffrida/frida-tools";
import { Effect, Option, Stream } from "effect";

import { FridaLive } from "../base.ts";

const ScriptLive = FridaScript.layer(new URL("main.agent.ts", import.meta.url));

layer(FridaLive, { excludeTestServices: true })("local device tests", (it) => {
    it.layer(ScriptLive)((it) => {
        it.scoped("agent3 on local device", () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const firstMessage = yield* script.stream.pipe(Stream.runHead);
                expect(firstMessage).toStrictEqual(
                    Option.some({
                        message: "Hello from Frida! other->A another->A another->B",
                        data: Option.none(),
                    })
                );
            })
        );
    });
});
