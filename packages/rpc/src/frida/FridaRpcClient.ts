/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import "@efffrida/polyfills";

import type * as Scope from "effect/Scope";
import type * as RpcMessage from "effect/unstable/rpc/RpcMessage";

import * as Crypto from "effect/Crypto";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as RpcClient from "effect/unstable/rpc/RpcClient";
import * as RpcClientError from "effect/unstable/rpc/RpcClientError";
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization";

import * as constants from "../shared/Constants.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (): Effect.Effect<
    RpcClient.Protocol["Service"],
    never,
    Crypto.Crypto | RpcSerialization.RpcSerialization | Scope.Scope
> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse, clientIds) {
            const serialization = yield* RpcSerialization.RpcSerialization;
            const crypto = yield* Crypto.Crypto;

            const encoder = new TextEncoder();
            const parser = serialization.makeUnsafe();
            const requestClientMap = new Map<string, number>();

            const exportName = yield* crypto.randomUUIDv4.pipe(Effect.orDie);
            const connectionRequest = constants.nodeRpcClientMakeConnectionRequestForServer(exportName);

            const broadcast = (response: RpcMessage.FromServerEncoded) =>
                Effect.forEach(clientIds, (id) => writeResponse(id, response), { discard: true });

            yield* Effect.addFinalizer(() => Effect.sync(() => delete rpc.exports[exportName]));
            rpc.exports[exportName] = (data: string | Uint8Array): Promise<void> => {
                try {
                    const responses = parser.decode(data) as Array<RpcMessage.FromServerEncoded>;
                    if (responses.length === 0) return Promise.resolve();
                    let i = 0;
                    return Effect.whileLoop({
                        step: Function.constVoid,
                        while: () => i < responses.length,
                        body: () => {
                            const response = responses[i++]!;
                            if ("requestId" in response) {
                                const clientId = requestClientMap.get(response.requestId)!;
                                if (response._tag === "Exit") requestClientMap.delete(response.requestId);
                                return writeResponse(clientId, response);
                            } else return broadcast(response);
                        },
                    }).pipe(Effect.runPromise);
                } catch (defect) {
                    return broadcast({
                        _tag: "ClientProtocolError",
                        error: new RpcClientError.RpcClientError({
                            reason: new RpcClientError.RpcClientDefect({
                                message: "Error decoding message",
                                cause: defect,
                            }),
                        }),
                    }).pipe(Effect.runPromise);
                }
            };

            send(connectionRequest);

            return {
                supportsAck: true,
                supportsTransferables: false,
                send(clientId, request) {
                    if (request._tag === "Request") {
                        requestClientMap.set(request.id, clientId);
                    }

                    const encoded = parser.encode(request);
                    if (encoded === undefined) return Effect.void;
                    const transformed = typeof encoded === "string" ? encoder.encode(encoded) : encoded;
                    return Effect.sync(() => send(exportName, (transformed as Uint8Array<ArrayBuffer>).buffer));
                },
            };
        })
    );

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerProtocolFrida: Layer.Layer<
    RpcClient.Protocol,
    never,
    Crypto.Crypto | RpcSerialization.RpcSerialization
> = Layer.effect(RpcClient.Protocol, makeProtocolFrida());
