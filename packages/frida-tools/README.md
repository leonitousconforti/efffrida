# @efffrida/frida-tools

Provides effectful abstractions for frida such as connecting to devices,
managing sessions, and creating scripts.

### Example usage

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";

// Pick a device and a program to spawn and attach to
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer(["/usr/bin/sleep", "infinity"]);
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive);

const ScriptLive = FridaScript.layer(new URL("agent.ts", import.meta.url)).pipe(Layer.provide(FridaLive));

const program = Effect.gen(function* () {
    const script = yield* FridaScript.FridaScript;
    const message = yield* Stream.runHead(script.stream);
    // ...
}).pipe(Effect.provide(ScriptLive));

NodeRuntime.runMain(program);
```
