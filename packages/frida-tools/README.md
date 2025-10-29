# @efffrida/frida-tools

Provides effectful abstractions for frida such as connecting to devices, managing sessions, and creating scripts.

### Example usage

```typescript
import { Path } from "@effect/platform";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer, Stream } from "effect";

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive);

const ScriptLive = FridaScript.layer(new URL("agent.ts", import.meta.url))
    .pipe(Layer.provide(FridaLive))
    .pipe(Layer.provide(Path.layer));

const program = Effect.gen(function* () {
    const script = yield* FridaScript.FridaScript;
    const messages = yield* Stream.runHead(script.stream);
    // ...
}).pipe(Effect.provide(ScriptLive));
```
