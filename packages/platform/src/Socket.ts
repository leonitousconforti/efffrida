/**
 * Effect `Socket` utilities for Frida.
 *
 * Sockets read with backpressure: at most one `InputStream.read` is in flight
 * and only while the consumer is pulling. As with every Effect 4 socket, any
 * close, including end of stream (code 1000), fails the reader with a
 * `SocketError` wrapping a `SocketCloseError`. Frida streams have no
 * half-close, so releasing the writer does not signal end of stream to the
 * peer; write a `Socket.CloseEvent` or close the reader scope instead.
 *
 * @since 1.0.0
 */

import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import type * as EffectSocket from "effect/socket/Socket";
import type * as SocketServer from "effect/socket/SocketServer";

import * as internal from "./internal/socket.ts";

/**
 * Wraps an existing connection. The connection is closed when the scope of
 * the first reader acquisition closes, so the socket can be read only once.
 *
 * @since 1.0.0
 * @category Network
 * @see https://frida.re/docs/javascript-api/#socketconnection
 */
export const liftSocketConnection: (
    socketConnection: SocketConnection
) => Effect.Effect<EffectSocket.Socket, never, never> = internal.liftSocketConnection;

/**
 * Connect to a TCP or UNIX server. Each reader acquisition opens a new
 * connection, closed when the reader scope closes.
 *
 * @since 1.0.0
 * @category Network
 */
export const connect: (options: SocketConnectOptions) => Effect.Effect<EffectSocket.Socket, never, never> =
    internal.connect;

/**
 * Opens a TCP or UNIX listening socket and accepts a single connection.
 *
 * Each reader acquisition binds a listener, waits for exactly one client,
 * then closes the listener, so later clients are refused until the next
 * acquisition. The bound port is not observable, so pass an explicit `port`
 * (or a UNIX `path`); use {@link makeServer} to accept many connections or to
 * learn the bound address.
 *
 * @since 1.0.0
 * @category Network
 */
export const listen: (options?: SocketListenOptions | undefined) => Effect.Effect<EffectSocket.Socket, never, never> =
    internal.listen;

/**
 * Opens a TCP or UNIX listening socket as a `SocketServer`. Defaults to
 * listening on both IPv4 and IPv6, if supported, and binding on all interfaces
 * on a randomly selected TCP port; the bound port is available on `address`.
 * `run` accepts connections until interrupted, running the handler for each
 * one in its own fiber and closing the connection when the handler finishes.
 * The listener is closed when the scope closes.
 *
 * @since 1.0.0
 * @category Network
 */
export const makeServer: (
    options?: SocketListenOptions | undefined
) => Effect.Effect<SocketServer.SocketServer["Service"], SocketServer.SocketServerError, Scope.Scope> =
    internal.makeServer;

/**
 * Layer version of {@link makeServer}.
 *
 * @since 1.0.0
 * @category Network
 */
export const layerServer: (
    options?: SocketListenOptions | undefined
) => Layer.Layer<SocketServer.SocketServer, SocketServer.SocketServerError, never> = internal.layerServer;
