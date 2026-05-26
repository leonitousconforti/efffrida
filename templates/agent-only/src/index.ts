import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import * as FridaRuntime from "@efffrida/platform/FridaRuntime";

export class FridaVersion extends Context.Service<
    FridaVersion,
    {
        version: Effect.Effect<string, never, never>;
    }
>()("FridaVersion", {
    make: () => {
        return Effect.succeed({
            version: Effect.sync(() => Frida.version),
        });
    },
}) {
    static readonly default = Layer.effect(this, this.make());
}

const program = Effect.gen(function* () {
    const version = yield* FridaVersion.use((frida) => frida.version);
    yield* Effect.logInfo("Agent initialized!");
    yield* Effect.logDebug(version);

    // Add your Frida instrumentation here:
    // - Intercept.attach(Module.getExportByName(null, "open"), {...})
    // - Memory.readUtf8String(ptr)
    // - Process.enumerateModules()
});

program.pipe(Effect.provide(FridaVersion.default), FridaRuntime.runMain);
