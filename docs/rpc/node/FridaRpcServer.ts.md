---
title: FridaRpcServer.ts
nav_order: 5
parent: "@efffrida/rpc"
---

## FridaRpcServer.ts overview

Implements a Frida RPC server protocol for effect using the frida script
exports.

Since v1.0.0

---

## Exports Grouped by Category

- [Layer](#layer)
  - [layerProtocolFrida](#layerprotocolfrida)
- [Protocol](#protocol)
  - [makeProtocolFrida](#makeprotocolfrida)

---

# Layer

## layerProtocolFrida

**Signature**

```ts
declare const layerProtocolFrida: Layer.Layer<
  RpcServer.Protocol,
  never,
  RpcSerialization.RpcSerialization | FridaScript.FridaScript
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcServer.ts#L142)

Since v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: () => Effect.Effect<
  RpcServer.Protocol["Service"],
  never,
  FridaScript.FridaScript | RpcSerialization.RpcSerialization | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcServer.ts#L30)

Since v1.0.0
