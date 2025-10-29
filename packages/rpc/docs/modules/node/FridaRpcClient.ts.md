---
title: FridaRpcClient.ts
nav_order: 4
parent: Modules
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
  options?: { readonly exportName?: string | undefined } | undefined
) => Layer.Layer<
  RpcClient.Protocol,
  FridaSessionError.FridaSessionError,
  RpcSerialization.RpcSerialization | FridaScript.FridaScript
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcClient.ts#L114)

Since v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: (
  options?: { readonly exportName?: string | undefined } | undefined
) => Effect.Effect<
  RpcClient.Protocol["Type"],
  FridaSessionError.FridaSessionError,
  RpcSerialization.RpcSerialization | FridaScript.FridaScript | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcClient.ts#L30)

Since v1.0.0
