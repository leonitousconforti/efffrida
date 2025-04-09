/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports. The reason we don't use the send/recv script channels is because
 * those are shared channels by everybody.
 *
 * @since 1.0.0
 */

import type * as RpcMessage from "@effect/rpc/RpcMessage";
import type * as Types from "effect/Types";
import type * as Frida from "frida";

import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (
    script: Frida.Script,
    options?: { readonly exportName?: string | undefined } | undefined
): Effect.Effect<RpcClient.Protocol["Type"], never, RpcSerialization.RpcSerialization> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse) {
            const serialization = yield* RpcSerialization.RpcSerialization;
            const exportName = options?.exportName ?? "rpc";

            const send = (request: RpcMessage.FromClientEncoded): Effect.Effect<void> => {
                if (request._tag !== "Request") {
                    return Effect.void;
                }

                const parser = serialization.unsafeMake();
                if (!serialization.supportsBigInt) {
                    const mutable = request as Types.Mutable<typeof request>;
                    mutable.id = request.id.toString();
                }

                return Effect.flatMap(
                    Effect.promise(() => script.exports[exportName](parser.encode(request))),
                    (responseData) => {
                        try {
                            const responses = parser.decode(responseData) as Array<RpcMessage.FromServerEncoded>;
                            if (responses.length === 0) return Effect.void;
                            let i = 0;
                            return Effect.whileLoop({
                                while: () => i < responses.length,
                                body: () => writeResponse(responses[i++]),
                                step: Function.constVoid,
                            });
                        } catch (defect) {
                            return writeResponse({ _tag: "Defect", defect });
                        }
                    }
                );
            };

            return {
                send,
                supportsAck: false,
                supportsTransferables: false,
            };
        })
    );

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerProtocolFrida = (
    options?: { readonly exportName?: string | undefined } | undefined
): Layer.Layer<RpcClient.Protocol, never, RpcSerialization.RpcSerialization | FridaScript.FridaScript> =>
    Layer.effect(
        RpcClient.Protocol,
        Effect.flatMap(FridaScript.FridaScript, ({ script }) => makeProtocolFrida(script, options))
    );
