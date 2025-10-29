---
title: Socket.ts
nav_order: 6
parent: Modules
---

## Socket.ts overview

Effect `Socket` utilities for Frida.

Since v1.0.0

---

## Exports Grouped by Category

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
declare const connect: (options: SocketConnectOptions) => Effect.Effect<EffectSocket.Socket, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Socket.ts#L27)

Since v1.0.0

## liftSocketConnection

**See**

- https://frida.re/docs/javascript-api/#socketconnection

**Signature**

```ts
declare const liftSocketConnection: (
  socketConnection: SocketConnection
) => Effect.Effect<EffectSocket.Socket, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Socket.ts#L17)

Since v1.0.0

## listen

Opens a TCP or UNIX listening socket. Defaults to listening on both IPv4 and
IPv6, if supported, and binding on all interfaces on a randomly selected TCP
port.

**Signature**

```ts
declare const listen: (
  options?: (SocketListenOptions & { readonly closeCodeIsError?: (code: number) => boolean }) | undefined
) => Effect.Effect<EffectSocket.Socket, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Socket.ts#L38)

Since v1.0.0
