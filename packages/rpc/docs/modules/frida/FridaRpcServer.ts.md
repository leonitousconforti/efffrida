---
title: FridaRpcServer.ts
nav_order: 2
parent: Modules
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
  - [makeProtocolFridaWithExport](#makeprotocolfridawithexport)

---

# Layer

## layerProtocolFrida

**Signature**

```ts
declare const layerProtocolFrida: (
  options?:
    | {
        readonly exportName?: string | undefined
        readonly generateExportName?: ((clientId: number) => string) | undefined
      }
    | undefined
) => Layer.Layer<RpcServer.Protocol, never, RpcSerialization.RpcSerialization>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcServer.ts#L154)

Since v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: (
  options?: { readonly generateExportName?: ((clientId: number) => string) | undefined } | undefined
) => Effect.Effect<
  { readonly protocol: RpcServer.Protocol["Type"]; readonly rpcExport: () => Promise<number> },
  never,
  RpcSerialization.RpcSerialization
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcServer.ts#L23)

Since v1.0.0

## makeProtocolFridaWithExport

**Signature**

```ts
declare const makeProtocolFridaWithExport: (
  options?:
    | {
        readonly exportName?: string | undefined
        readonly generateExportName?: ((clientId: number) => string) | undefined
      }
    | undefined
) => Effect.Effect<RpcServer.Protocol["Type"], never, RpcSerialization.RpcSerialization>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/rpc/blob/main/src/FridaRpcServer.ts#L130)

Since v1.0.0
