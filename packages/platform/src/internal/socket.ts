import * as EffectSocket from "@effect/platform/Socket";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import * as internalStream from "./stream.js";

/** @internal */
export const toTransformStream = (socketConnection: SocketConnection): EffectSocket.InputTransformStream => ({
    readable: internalStream
        .fromInputStream(
            () => socketConnection.input,
            (error) => error
        )
        .pipe(Stream.toReadableStream()),
    writable: socketConnection.output,
});

/** @internal */
export const liftSocketConnection = (
    socketConnection: SocketConnection
): Effect.Effect<EffectSocket.Socket, never, never> =>
    EffectSocket.fromTransformStream(Effect.sync(() => toTransformStream(socketConnection)));

/** @internal */
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

/** @internal */
export const listen = (
    options?: (SocketListenOptions & { readonly closeCodeIsError?: (code: number) => boolean }) | undefined
): Effect.Effect<EffectSocket.Socket, never, never> => {
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
    return EffectSocket.fromTransformStream(
        transformStream,
        options?.closeCodeIsError ? { closeCodeIsError: options?.closeCodeIsError } : {}
    );
};
