import * as Effect from "effect/Effect";

import * as FridaRuntime from "@efffrida/platform/FridaRuntime";

const program = Effect.gen(function* () {
    yield* Effect.log("Agent initialized!");
    // Add your Frida instrumentation here:
    // - Intercept.attach(Module.getExportByName(null, "open"), {...})
    // - Memory.readUtf8String(ptr)
    // - Process.enumerateModules()
});

FridaRuntime.runMain(program);
