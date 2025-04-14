# @efffrida/frida-tools

Provides effectful abstractions for frida such as: connecting to devices, managing sessions, and creating script.

### Example usage

```typescript
import { NodeContext } from "@effect/platform-node";
import { FridaCompile } from "@efffrida/frida-compile";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { Effect, Layer, Stream } from "effect";
import { ScriptRuntime } from "frida";

// Pick a device and a session/program
const DeviceLive = FridaDevice.layerLocalDevice;
const SessionLive = FridaSession.layer("/usr/bin/sleep");
const FridaLive = Layer.provideMerge(SessionLive, DeviceLive);

// Compile the agent
const ScriptLive = FridaCompile.compileAgent(new URL("../frida/agent.ts", import.meta.url))
    .pipe(Effect.map(FridaScript.layer()))
    .pipe(Layer.unwrapEffect)
    .pipe(Layer.provide([FridaLive, NodeContext.layer]));

const program = Effect.gen(function* () {
    const script = yield* FridaScript.FridaScript;
    const messages = yield* Stream.runHead(script.stream);
    // ...
}).pipe(Effect.scoped)
```
