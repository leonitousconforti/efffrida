import "core-js/stable/url";

import { describe, it } from "@effect/vitest";
import { FridaIl2cppBridge } from "@efffrida/il2cpp-bridge";
import { Effect } from "effect";

describe("il2cpp-bridge", () => {
    it.effect("should run il2cpp bridge program", () =>
        FridaIl2cppBridge.il2cppPerformEffect(
            Effect.gen(function* () {
                send("Hello from il2cpp bridge test");
            })
        )
    );
});
