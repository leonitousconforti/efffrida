/**
 * Effect `Socket` utilities for Frida.
 *
 * @since 1.0.0
 */

import * as EffectSocket from "@effect/platform/Socket";
import * as Effect from "effect/Effect";

/**
 * @internal
 * @see https://frida.re/docs/javascript-api/#socketconnection
 */
export const fromSocketConnection = (
    socketConnection: SocketConnection
): Effect.Effect<EffectSocket.Socket, never, never> =>
    EffectSocket.fromTransformStream(Effect.sync(() => toTransformStream(socketConnection)));

/**
 * Connect to a TCP or UNIX server.
 *
 * @since 1.0.0
 * @category Network
 */
export const connect = (options: SocketConnectOptions): Effect.Effect<EffectSocket.Socket, never, never> =>
    EffectSocket.fromTransformStream(
        Effect.map(
            Effect.tryPromise({
                try: () => Socket.connect(options),
                catch: (error) => new EffectSocket.SocketGenericError({ reason: "Open" as const, cause: error }),
            }),
            toTransformStream
        )
    );

/**
 * Opens a TCP or UNIX listening socket. Defaults to listening on both IPv4 and
 * IPv6, if supported, and binding on all interfaces on a randomly selected TCP
 * port.
 *
 * @since 1.0.0
 * @category Network
 */
export const listen = (options?: SocketListenOptions | undefined): Effect.Effect<EffectSocket.Socket, never, never> => {
    // Acquire a socket listener
    const error = (error: unknown) => new EffectSocket.SocketGenericError({ reason: "Open" as const, cause: error });
    const acquireSocketListener = Effect.tryPromise({ try: () => Socket.listen(options), catch: error });
    const releaseSocketListener = (socketListener: SocketListener) => Effect.promise(() => socketListener.close());

    // Transform the socket listener into a scoped socket connection
    const scopedSocketConnection = Effect.flatMap(
        Effect.acquireRelease(acquireSocketListener, releaseSocketListener),
        (socketListener) => Effect.tryPromise({ try: () => socketListener.accept(), catch: error })
    );

    // Transform the scoped socket connection into a transform stream
    const transformStream = Effect.map(scopedSocketConnection, toTransformStream);

    // Make the socket from the transform stream
    return EffectSocket.fromTransformStream(transformStream);
};
