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

- [Protocol](#protocol)
  - [makeProtocolFrida](#makeprotocolfrida)

---

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: () => Effect.Effect<
  unknown,
  never,
  FridaScript.FridaScript | RpcSerialization.RpcSerialization | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcServer.ts#L32)

Since v1.0.0
