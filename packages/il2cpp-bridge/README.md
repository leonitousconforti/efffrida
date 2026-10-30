# @efffrida/il2cpp-bridge

Effect integration for
[frida-il2cpp-bridge](https://github.com/vfsfitvnm/frida-il2cpp-bridge), for use
inside frida agents that instrument Unity il2cpp applications.

- `FridaIl2cppBridge.il2cppPerformEffect` runs an effect inside
  `Il2Cpp.perform`, so the caller thread is attached to the il2cpp domain while
  it executes.
- `Assembly` and `Class` look up assemblies, classes, fields, methods, and
  nested classes as effects. The plain variants (`assembly`, `class`, `field`,
  ...) treat a missing member as a defect, the `try*` variants fail with a
  `NoSuchElementError` instead, and the `*Cached` variants memoize lookups in a
  `Cache` sized by the `CacheCapacity` reference (100 by default). Cache keys
  compare il2cpp objects by their native handle.
- `Equivalence` compares images, classes, fields, and methods by their native
  handle.
- `Extensions` provides `Dictionary` and `List` wrappers over
  `System.Collections.Generic.Dictionary` and `System.Collections.Generic.List`
  objects.

### Example usage

```typescript
import "@efffrida/polyfills";

import * as Effect from "effect/Effect";

import { Assembly, Class, Extensions, FridaIl2cppBridge } from "@efffrida/il2cpp-bridge";
import { FridaRuntime } from "@efffrida/platform";

Effect.gen(function* () {
    const csharp = yield* Assembly.assembly("Assembly-CSharp");
    const player = yield* Class.tryClass(csharp.image, "Player");
    const allPlayers = yield* Class.tryField<Il2Cpp.Object>(player, "s_AllPlayers");

    const players = Extensions.List.lift(allPlayers.value);
    yield* Effect.logInfo(`There are ${players.length} players`);
}).pipe(FridaIl2cppBridge.il2cppPerformEffect, FridaRuntime.runMain);
```
