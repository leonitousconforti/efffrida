import * as Effect from "effect/Effect";

import * as FridaRuntime from "@efffrida/platform/FridaRuntime";

const program = Effect.gen(function* () {
    yield* Effect.log("Agent initialized!");
});

FridaRuntime.runMain(program);
