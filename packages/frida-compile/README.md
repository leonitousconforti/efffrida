# @efffrida/frida-compile

Provides an effectful interface for bundling frida agents. Inserts all the shims necessary to run Effect inside the frida runtime.

### Example usage

```typescript
import { NodeContext } from "@effect/platform-node";
import { FridaCompile } from "@efffrida/frida-compile";
import { Effect } from "effect";

const program = Effect.gen(function* () {
    const agentLocation = new URL("../frida/agent1/main.ts", import.meta.url)
    const source = yield* FridaCompile.compileAgent(agentLocation);
    // ...
}).pipe(Effect.provide(NodeContext.layer))
```
