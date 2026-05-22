---
title: FridaRpcClient.ts
nav_order: 1
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
declare const layerProtocolFrida: Layer.Layer<
  RpcClient.Protocol,
  never,
  RpcSerialization.RpcSerialization | Crypto.Crypto
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcClient.ts#L101)

Since v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: () => Effect.Effect<
  RpcClient.Protocol["Service"],
  never,
  Crypto.Crypto | RpcSerialization.RpcSerialization | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcClient.ts#L27)

Since v1.0.0
