import { Effect } from "effect";

import { FridaRuntime } from "@efffrida/platform";

import { FridaVersion } from "./FridaVersion.ts";

const program = Effect.gen(function* () {
    const version = yield* FridaVersion.use((frida) => frida.version);
    yield* Effect.logInfo("Agent initialized!");
    yield* Effect.logDebug(version);

    // Add your Frida instrumentation here:
    // - Interceptor.attach(Module.getGlobalExportByName("open"), {...})
    // - pointer.readUtf8String()
    // - Process.enumerateModules()
});

// oxlint-disable-next-line effecttsgo/strict-effect-provide -- this is the entry point
program.pipe(Effect.provide(FridaVersion.layer), FridaRuntime.runMain);
