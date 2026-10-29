---
title: Socket.ts
nav_order: 6
parent: Modules
---

## Socket.ts overview

Effect `Socket` utilities for Frida.

Sockets read with backpressure: at most one `InputStream.read` is in flight
and only while the consumer is pulling. As with every Effect 4 socket, any
close, including end of stream (code 1000), fails the reader with a
`SocketError` wrapping a `SocketCloseError`. Frida streams have no
half-close, so releasing the writer does not signal end of stream to the
peer; write a `Socket.CloseEvent` or close the reader scope instead.

Since v1.0.0

---

## Exports Grouped by Category

- [Network](#network)
  - [connect](#connect)
  - [layerServer](#layerserver)
  - [liftSocketConnection](#liftsocketconnection)
  - [listen](#listen)
  - [makeServer](#makeserver)

---

# Network

## connect

Connect to a TCP or UNIX server. Each reader acquisition opens a new
connection, closed when the reader scope closes.

**Signature**

```ts
declare const connect: (options: SocketConnectOptions) => Effect.Effect<EffectSocket.Socket, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Socket.ts#L41)

Since v1.0.0

## layerServer

Layer version of `makeServer`.

**Signature**

```ts
declare const layerServer: (
  options?: SocketListenOptions | undefined
) => Layer.Layer<SocketServer.SocketServer, SocketServer.SocketServerError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Socket.ts#L81)

Since v1.0.0

## liftSocketConnection

Wraps an existing connection. The connection is closed when the scope of
the first reader acquisition closes, so the socket can be read only once.

**See**

- https://frida.re/docs/javascript-api/#socketconnection

**Signature**

```ts
declare const liftSocketConnection: (
  socketConnection: SocketConnection
) => Effect.Effect<EffectSocket.Socket, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Socket.ts#L30)

Since v1.0.0

## listen

Opens a TCP or UNIX listening socket and accepts a single connection.

Each reader acquisition binds a listener, waits for exactly one client,
then closes the listener, so later clients are refused until the next
acquisition. The bound port is not observable, so pass an explicit `port`
(or a UNIX `path`); use `makeServer` to accept many connections or to
learn the bound address.

**Signature**

```ts
declare const listen: (options?: SocketListenOptions | undefined) => Effect.Effect<EffectSocket.Socket, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Socket.ts#L56)

Since v1.0.0

## makeServer

Opens a TCP or UNIX listening socket as a `SocketServer`. Defaults to
listening on both IPv4 and IPv6, if supported, and binding on all interfaces
on a randomly selected TCP port; the bound port is available on `address`.
`run` accepts connections until interrupted, running the handler for each
one in its own fiber and closing the connection when the handler finishes.
The listener is closed when the scope closes.

**Signature**

```ts
declare const makeServer: (
  options?: SocketListenOptions | undefined
) => Effect.Effect<SocketServer.SocketServer["Service"], SocketServer.SocketServerError, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Socket.ts#L70)

Since v1.0.0
