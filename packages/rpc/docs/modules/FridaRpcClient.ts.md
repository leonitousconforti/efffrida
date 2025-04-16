---
title: FridaRpcClient.ts
nav_order: 1
parent: Modules
---

## FridaRpcClient overview

Implements a Frida RPC client protocol for effect using the frida script
exports. The reason we don't use the send/recv script channels is because
those are shared channels by everybody.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Layers](#layers)
  - [layerProtocolFrida](#layerprotocolfrida)
- [Protocol](#protocol)
  - [makeProtocolFrida](#makeprotocolfrida)

---

# Layers

## layerProtocolFrida

**Signature**

```ts
export declare const layerProtocolFrida: (
  options?:
    | {
        readonly exportName?: string | undefined
        readonly rpcIsAvailableWhen?: ((message: string) => boolean) | undefined
      }
    | undefined
) => Layer.Layer<
  RpcClient.Protocol,
  FridaSessionError.FridaSessionError,
  RpcSerialization.RpcSerialization | FridaScript.FridaScript
>
```

Added in v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
export declare const makeProtocolFrida: (
  script: FridaScript.FridaScript,
  options?:
    | {
        readonly exportName?: string | undefined
        readonly rpcIsAvailableWhen?: ((message: string) => boolean) | undefined
      }
    | undefined
) => Effect.Effect<RpcClient.Protocol["Type"], FridaSessionError.FridaSessionError, RpcSerialization.RpcSerialization>
```

Added in v1.0.0
