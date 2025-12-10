---
title: FridaRpcClient.ts
nav_order: 1
parent: "@efffrida/rpc"
---

## FridaRpcClient.ts overview

Implements a Frida RPC client protocol for effect using the frida script
exports.

Since v1.0.0

---

## Exports Grouped by Category

- [Layers](#layers)
  - [layerProtocolFrida](#layerprotocolfrida)
- [Protocol](#protocol)
  - [makeProtocolFrida](#makeprotocolfrida)

---

# Layers

## layerProtocolFrida

**Signature**

```ts
declare const layerProtocolFrida: (
  options?:
    | {
        readonly generateExportName?: (() => string) | undefined
        readonly receivingStreamShareOptions?:
          | {
              readonly capacity: "unbounded"
              readonly replay?: number | undefined
              readonly idleTimeToLive?: Duration.DurationInput | undefined
            }
          | {
              readonly capacity: number
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined
              readonly replay?: number | undefined
              readonly idleTimeToLive?: Duration.DurationInput | undefined
            }
          | undefined
      }
    | undefined
) => Layer.Layer<RpcClient.Protocol, never, RpcSerialization.RpcSerialization>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcClient.ts#L162)

Since v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: (
  options?:
    | {
        readonly generateExportName?: (() => string) | undefined
        readonly receivingStreamShareOptions?:
          | {
              readonly capacity: "unbounded"
              readonly replay?: number | undefined
              readonly idleTimeToLive?: Duration.DurationInput | undefined
            }
          | {
              readonly capacity: number
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined
              readonly replay?: number | undefined
              readonly idleTimeToLive?: Duration.DurationInput | undefined
            }
          | undefined
      }
    | undefined
) => Effect.Effect<RpcClient.Protocol["Type"], never, RpcSerialization.RpcSerialization | Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcClient.ts#L35)

Since v1.0.0
