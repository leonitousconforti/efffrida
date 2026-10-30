---
title: FridaRpcServer.ts
nav_order: 2
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
  - [makeProtocolFridaWithRpcExport](#makeprotocolfridawithrpcexport)

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/rpc/src/FridaRpcServer.ts#L201)

Since v1.0.0

# Protocol

## makeProtocolFrida

**Signature**

```ts
declare const makeProtocolFrida: (
  options?:
    | {
        readonly exportName?: string | undefined
        readonly generateExportName?: ((clientId: number) => string) | undefined
      }
    | undefined
) => Effect.Effect<RpcServer.Protocol["Service"], never, RpcSerialization.RpcSerialization | Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/rpc/src/FridaRpcServer.ts#L172)

Since v1.0.0

## makeProtocolFridaWithRpcExport

Makes a server protocol without registering the main rpc export. Call the
returned `rpcExport` (or register it under a name of your choosing) to
connect a new client.

**Signature**

```ts
declare const makeProtocolFridaWithRpcExport: (
  options?: { readonly generateExportName?: ((clientId: number) => string) | undefined } | undefined
) => Effect.Effect<
  { readonly protocol: RpcServer.Protocol["Service"]; readonly rpcExport: () => Promise<string> },
  never,
  RpcSerialization.RpcSerialization | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/rpc/src/FridaRpcServer.ts#L43)

Since v1.0.0
