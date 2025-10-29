/**
 * Effect `Socket` utilities for Frida.
 *
 * @since 1.0.0
 */

import type * as EffectSocket from "@effect/platform/Socket";
import type * as Effect from "effect/Effect";

import * as internal from "./internal/socket.ts";

/**
 * @since 1.0.0
 * @category Network
 * @see https://frida.re/docs/javascript-api/#socketconnection
 */
export const liftSocketConnection: (
    socketConnection: SocketConnection
) => Effect.Effect<EffectSocket.Socket, never, never> = internal.liftSocketConnection;

/**
 * Connect to a TCP or UNIX server.
 *
 * @since 1.0.0
 * @category Network
 */
export const connect: (options: SocketConnectOptions) => Effect.Effect<EffectSocket.Socket, never, never> =
    internal.connect;

/**
 * Opens a TCP or UNIX listening socket. Defaults to listening on both IPv4 and
 * IPv6, if supported, and binding on all interfaces on a randomly selected TCP
 * port.
 *
 * @since 1.0.0
 * @category Network
 */
export const listen: (
    options?: (SocketListenOptions & { readonly closeCodeIsError?: (code: number) => boolean }) | undefined
) => Effect.Effect<EffectSocket.Socket, never, never> = internal.listen;
