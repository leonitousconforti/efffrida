/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports. The reason we don't use the send/recv script channels is because
 * those are shared channels by everybody.
 *
 * @since 1.0.0
 */

import type * as RpcMessage from "@effect/rpc/RpcMessage";
import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";

import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (
    script: FridaScript.FridaScript,
    options?:
        | {
              readonly exportName?: string | undefined;
              readonly rpcIsAvailableWhen?: ((message: string) => boolean) | undefined;
          }
        | undefined
): Effect.Effect<RpcClient.Protocol["Type"], FridaSessionError.FridaSessionError, RpcSerialization.RpcSerialization> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse) {
            const serialization = yield* RpcSerialization.RpcSerialization;
            const exportName = options?.exportName ?? "rpc";
            const rpcIsAvailableWhen = options?.rpcIsAvailableWhen;

            const send = (request: RpcMessage.FromClientEncoded): Effect.Effect<void> => {
                if (request._tag !== "Request") {
                    return Effect.void;
                }

                const parser = serialization.unsafeMake();
                const schema = Schema.Union(Schema.String, Schema.Uint8Array);
                const encode = Function.compose(parser.encode, Schema.encode(schema));
                const decode = Function.compose(Schema.decodeUnknownSync(schema), parser.decode);

                return encode(request)
                    .pipe(Effect.flatMap(script.callExport(exportName)))
                    .pipe(Effect.orDie)
                    .pipe(
                        Effect.flatMap((incoming) => {
                            try {
                                const responses = decode(incoming) as Array<RpcMessage.FromServerEncoded>;
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
                        })
                    );
            };

            if (Predicate.isNotUndefined(rpcIsAvailableWhen)) {
                yield* script.stream
                    .pipe(Stream.map(({ message }) => message))
                    .pipe(Stream.filter(Predicate.isString))
                    .pipe(Stream.takeUntil(rpcIsAvailableWhen))
                    .pipe(Stream.runDrain);
            }

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
    options?:
        | {
              readonly exportName?: string | undefined;
              readonly rpcIsAvailableWhen?: ((message: string) => boolean) | undefined;
          }
        | undefined
): Layer.Layer<
    RpcClient.Protocol,
    FridaSessionError.FridaSessionError,
    RpcSerialization.RpcSerialization | FridaScript.FridaScript
> =>
    Layer.effect(
        RpcClient.Protocol,
        Effect.flatMap(FridaScript.FridaScript, (script) => makeProtocolFrida(script, options))
    );
