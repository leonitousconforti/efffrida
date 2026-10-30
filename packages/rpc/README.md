# @efffrida/rpc

Provides effect rpc protocol implementations (for use with `effect/rpc`) that
communicate over frida script messages and rpc exports. Either side can be the
server:

- `@efffrida/rpc/frida` runs inside the agent:
  `FridaRpcServer.layerProtocolFrida` and `FridaRpcClient.layerProtocolFrida`.
- `@efffrida/rpc/node` runs in node and requires a `FridaScript` from
  `@efffrida/frida-tools`: `FridaRpcClient.layerProtocolFrida` and
  `FridaRpcServer.layerProtocolFrida`.

Both sides must use the same `RpcSerialization`.

### Example usage

Shared rpc definitions, `requests.ts`:

```typescript
import * as Rpc from "effect/rpc/Rpc";
import * as RpcGroup from "effect/rpc/RpcGroup";
import * as Schema from "effect/Schema";

export class UserRpcs extends RpcGroup.make(
    Rpc.make("UserById", {
        success: Schema.Struct({ id: Schema.String, name: Schema.String }),
        error: Schema.String,
        payload: { id: Schema.String },
    })
) {}
```

Server, running inside the frida agent, `agent.ts`:

```typescript
import "@efffrida/polyfills";

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as RpcSerialization from "effect/rpc/RpcSerialization";
import * as RpcServer from "effect/rpc/RpcServer";

import { FridaRuntime } from "@efffrida/platform";
import { FridaRpcServer } from "@efffrida/rpc/frida";

import { UserRpcs } from "./requests.ts";

const UsersLive = UserRpcs.toLayer({
    UserById: ({ id }) => (id === "1" ? Effect.succeed({ id, name: "Alice" }) : Effect.fail(`User not found: ${id}`)),
});

const ProtocolLive = FridaRpcServer.layerProtocolFrida().pipe(Layer.provide(RpcSerialization.layerNdjson));
const Main = RpcServer.layer(UserRpcs).pipe(Layer.provide(UsersLive), Layer.provide(ProtocolLive));

FridaRuntime.runMain(Layer.launch(Main));
```

Client, running in node, `main.ts`:

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as RpcClient from "effect/rpc/RpcClient";
import * as RpcSerialization from "effect/rpc/RpcSerialization";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc/node";

import { UserRpcs } from "./requests.ts";

const FridaLive = Layer.provideMerge(FridaSession.layer(["/usr/bin/sleep", "infinity"]), FridaDevice.layerLocalDevice);
const ScriptLive = FridaScript.layer(new URL("agent.ts", import.meta.url)).pipe(Layer.provide(FridaLive));

const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(
    Layer.provide(RpcSerialization.layerNdjson),
    Layer.provide(ScriptLive)
);

const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(UserRpcs);
    const user = yield* client.UserById({ id: "1" });
    yield* Effect.log(user);
}).pipe(Effect.scoped, Effect.provide(ProtocolLive));

NodeRuntime.runMain(program);
```

The reverse direction works the same way: `FridaRpcServer.layerProtocolFrida`
from `@efffrida/rpc/node` serves rpcs to `FridaRpcClient.layerProtocolFrida`
from `@efffrida/rpc/frida`.
