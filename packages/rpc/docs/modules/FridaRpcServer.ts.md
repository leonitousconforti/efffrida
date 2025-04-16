---
title: FridaRpcServer.ts
nav_order: 2
parent: Modules
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
) => Effect.Effect<
  {
    readonly run: (
      f: (clientId: number, data: RpcMessage.FromClientEncoded) => Effect.Effect<void>
    ) => Effect.Effect<never>
    readonly disconnects: Mailbox.ReadonlyMailbox<number>
    readonly send: (
      clientId: number,
      response: RpcMessage.FromServerEncoded,
      transferables?: ReadonlyArray<globalThis.Transferable>
    ) => Effect.Effect<void>
    readonly end: (clientId: number) => Effect.Effect<void>
    readonly initialMessage: Effect.Effect<Option<unknown>>
    readonly supportsAck: boolean
    readonly supportsTransferables: boolean
    readonly supportsSpanPropagation: boolean
  },
  never,
  RpcSerialization.RpcSerialization
>
```

Added in v1.0.0
