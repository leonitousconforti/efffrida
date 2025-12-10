import { expect, layer } from "@effect/vitest";
import { FridaScript } from "@efffrida/frida-tools";
import { Effect, Option, Stream } from "effect";

import { FridaLive } from "../base.ts";

const ScriptLive = FridaScript.layer(new URL("effect.agent.ts", import.meta.url));

layer(FridaLive, { excludeTestServices: true, timeout: "1 minute" })("local device tests", (it) => {
    it.layer(ScriptLive)((it) => {
        it.scoped("agent4 on local device", () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const firstMessage = yield* Stream.runHead(script.stream);
                expect(firstMessage).toStrictEqual(
                    Option.some({
                        message: "Hello from Effect!",
                        data: Option.none(),
                    })
                );
            })
        );
    });
});
