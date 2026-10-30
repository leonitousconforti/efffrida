/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import "@efffrida/polyfills";

import type * as RpcMessage from "effect/rpc/RpcMessage";
import type * as Scope from "effect/Scope";

import * as Effect from "effect/Effect";
import * as FiberSet from "effect/FiberSet";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as RpcClient from "effect/rpc/RpcClient";
import * as RpcClientError from "effect/rpc/RpcClientError";
import * as RpcSerialization from "effect/rpc/RpcSerialization";

import * as constants from "../shared/Constants.ts";

/** Copies only the bytes covered by the view, not its whole backing buffer. */
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? (bytes.buffer as ArrayBuffer)
        : (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);

/** Export names only need to be unique within this script. */
let nextExportId = 0;

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (): Effect.Effect<
    RpcClient.Protocol["Service"],
    never,
    RpcSerialization.RpcSerialization | Scope.Scope
> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse, clientIds) {
            const serialization = yield* RpcSerialization.RpcSerialization;
            const runPromise = yield* FiberSet.makeRuntimePromise();

            const encoder = new TextEncoder();
            const parser = serialization.makeUnsafe();
            const requestClientMap = new Map<string | number, number>();

            const exportName = `efffrida-rpc-client-${nextExportId++}`;
            const connectionRequest = constants.nodeRpcClientMakeConnectionRequestForServer(exportName);
            const disconnectionRequest = constants.nodeRpcClientMakeDisconnectionRequestForServer(exportName);

            const broadcast = (response: RpcMessage.FromServerEncoded) =>
                Effect.forEach(clientIds, (id) => writeResponse(id, response), { discard: true });

            yield* Effect.addFinalizer(() =>
                Effect.sync(() => {
                    delete rpc.exports[exportName];
                    send(disconnectionRequest);
                })
            );

            // Binary data sent as a node Buffer arrives as an ArrayBuffer
            rpc.exports[exportName] = (data: string | ArrayBuffer): Promise<void> => {
                try {
                    const responses = parser.decode(
                        typeof data === "string" ? data : new Uint8Array(data)
                    ) as Array<RpcMessage.FromServerEncoded>;
                    if (responses.length === 0) return Promise.resolve();
                    let i = 0;
                    return Effect.whileLoop({
                        step: Function.constVoid,
                        while: () => i < responses.length,
                        body: () => {
                            const response = responses[i++];
                            if ("requestId" in response) {
                                const clientId = requestClientMap.get(response.requestId)!;
                                if (response._tag === "Exit") requestClientMap.delete(response.requestId);
                                return writeResponse(clientId, response);
                            } else return broadcast(response);
                        },
                    }).pipe(runPromise);
                } catch (defect) {
                    return broadcast({
                        _tag: "ClientProtocolError",
                        error: new RpcClientError.RpcClientError({
                            reason: new RpcClientError.RpcClientDefect({
                                message: "Error decoding message",
                                cause: defect,
                            }),
                        }),
                    }).pipe(runPromise);
                }
            };

            send(connectionRequest);

            return {
                supportsAck: true,
                supportsTransferables: false,
                codecFor: serialization.codecFor,
                send(clientId, request) {
                    if (request._tag === "Request") {
                        requestClientMap.set(request.id, clientId);
                    }

                    const encoded = parser.encode(request);
                    if (encoded === undefined) return Effect.void;
                    const transformed = typeof encoded === "string" ? encoder.encode(encoded) : encoded;
                    return Effect.sync(() => send(exportName, toArrayBuffer(transformed)));
                },
            };
        })
    );

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerProtocolFrida: Layer.Layer<RpcClient.Protocol, never, RpcSerialization.RpcSerialization> =
    Layer.effect(RpcClient.Protocol, makeProtocolFrida());
