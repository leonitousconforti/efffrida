---
title: Socket.ts
nav_order: 6
parent: Modules
---

## Socket overview

Effect `Socket` utilities for Frida.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Network](#network)
  - [connect](#connect)
  - [liftSocketConnection](#liftsocketconnection)
  - [listen](#listen)

---

# Network

## connect

Connect to a TCP or UNIX server.

**Signature**

```ts
export declare const connect: (options: SocketConnectOptions) => Effect.Effect<EffectSocket.Socket, never, never>
```

Added in v1.0.0

## liftSocketConnection

**Signature**

```ts
export declare const liftSocketConnection: (
  socketConnection: SocketConnection
) => Effect.Effect<EffectSocket.Socket, never, never>
```

Added in v1.0.0

## listen

Opens a TCP or UNIX listening socket. Defaults to listening on both IPv4 and
IPv6, if supported, and binding on all interfaces on a randomly selected TCP
port.

**Signature**

```ts
export declare const listen: (
  options?: (SocketListenOptions & { readonly closeCodeIsError?: (code: number) => boolean }) | undefined
) => Effect.Effect<EffectSocket.Socket, never, never>
```

Added in v1.0.0
