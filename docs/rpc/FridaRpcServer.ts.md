---
title: FridaRpcServer.ts
nav_order: 2
parent: "@efffrida/rpc"
---

## FridaRpcServer overview

Implements a Frida RPC server protocol for effect using the frida script
exports. The reason we don't use the send/recv script channels is because
those are shared channels by everybody.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Layer](#layer)
  - [layerProtocolFrida](#layerprotocolfrida)
- [Protocol](#protocol)
  - [makeProtocolFrida](#makeprotocolfrida)
  - [makeProtocolFridaWithExport](#makeprotocolfridawithexport)

---

# Layer

## layerProtocolFrida

**Signature**

```ts
export declare const layerProtocolFrida: (
  options?:
    | { readonly exportName?: string | undefined; readonly messageOnRpcAvailable?: string | undefined }
    | undefined
) => Layer.Layer<RpcServer.Protocol, never, RpcSerialization.RpcSerialization>
```

Added in v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
export declare const makeProtocolFrida: Effect.Effect<
  {
    protocol: RpcServer.Protocol["Type"]
    rpcExport: (request: string | Uint8Array) => Promise<string | ReadonlyArray<number>>
  },
  never,
  RpcSerialization.RpcSerialization
>
```

Added in v1.0.0

## makeProtocolFridaWithExport

**Signature**

```ts
export declare const makeProtocolFridaWithExport: (
  options?:
    | { readonly exportName?: string | undefined; readonly messageOnRpcAvailable?: string | undefined }
    | undefined
) => Effect.Effect<RpcServer.Protocol["Type"], never, RpcSerialization.RpcSerialization>
```

Added in v1.0.0
