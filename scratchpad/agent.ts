import "@efffrida/polyfills";

import { Effect } from "effect";

import { FridaIl2cppBridge, Assembly, Class } from "@Efffrida/il2cpp-bridge";
import { FridaRuntime } from "@efffrida/platform";

Effect.gen(function* () {
    const CSharpAssembly = yield* Assembly.assembly("Assembly-CSharp");
    const NBSyncClass = yield* Class.class(CSharpAssembly.image, "NBSync");
    yield* Effect.logInfo(NBSyncClass.handle);
    send("here");
}).pipe(FridaIl2cppBridge.il2cppPerformEffect, FridaRuntime.runMain);
