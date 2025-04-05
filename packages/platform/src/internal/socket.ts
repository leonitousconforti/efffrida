import type * as EffectSocket from "@effect/platform/Socket";

/** @internal */
export const toTransformStream = (socketConnection: SocketConnection): EffectSocket.InputTransformStream => ({
    readable: socketConnection.input,
    writable: socketConnection.output,
});
