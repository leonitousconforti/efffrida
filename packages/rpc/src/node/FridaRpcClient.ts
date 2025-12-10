/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import type * as RpcMessage from "@effect/rpc/RpcMessage";
import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";
import type * as Scope from "effect/Scope";

import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as ParseResult from "effect/ParseResult";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";

import * as constants from "../shared/constants.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (
    options?:
        | {
              /**
               * Name for the main rpc export that all clients start by
               * connecting to.
               */
              readonly exportName?: string | undefined;

              /** Generates server listener rpc exports for individual clients. */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Effect.Effect<
    RpcClient.Protocol["Type"],
    FridaSessionError.FridaSessionError,
    RpcSerialization.RpcSerialization | FridaScript.FridaScript | Scope.Scope
> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse) {
            const script = yield* FridaScript.FridaScript;
            const serialization = yield* RpcSerialization.RpcSerialization;

            const parser = serialization.unsafeMake();
            const mainExportName = options?.exportName ?? constants.defaultServerMainExportName;
            const makeExportName = options?.generateExportName ?? constants.generateServerExportNameForClient;

            /**
             * Obtain a client id from the frida script export, this will allow
             * us to filter future messages for ours since the script channels
             * are shared.
             */
            const clientId = yield* Effect.catchIf(
                script.callExport(mainExportName, Schema.Number)(),
                ParseResult.isParseError,
                () => Effect.dieMessage("Failed to obtain client ID from Frida script export")
            );

            const isClientId = Predicate.compose(Predicate.isNumber, (id) => id === clientId);
            const receivingPredicate = Predicate.compose(
                Predicate.isUnknown,
                Predicate.struct({ clientId: isClientId })
            );

            /**
             * Start listening for responses to our requests, decode them, and
             * send the responses back to the implementation.
             */
            yield* script.stream.pipe(
                Stream.filterMap((unfiltered) => {
                    if (receivingPredicate(unfiltered.message)) return unfiltered.data;
                    else return Option.none<Buffer<ArrayBufferLike>>();
                }),
                Stream.runForEach((filtered) => {
                    try {
                        const responses = parser.decode(filtered) as Array<RpcMessage.FromServerEncoded>;
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
                }),
                Effect.interruptible,
                Effect.forkScoped
            );

            /**
             * Sending messages is as simple as encoding them, then posting them
             * to the frida side tagged with our client id so it knows where to
             * send them back to.
             */
            const send = Effect.fnUntraced(function* (message: RpcMessage.FromClientEncoded) {
                const encoded = parser.encode(message);
                if (Predicate.isUndefined(encoded)) return;
                yield* script.callExport(makeExportName(clientId), Schema.Void)(encoded).pipe(Effect.orDie);
            });

            return {
                send,
                supportsAck: true,
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
              /**
               * Name for the main rpc export that all clients start by
               * connecting to.
               */
              readonly exportName?: string | undefined;

              /** Generates server listener rpc exports for individual clients. */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Layer.Layer<
    RpcClient.Protocol,
    FridaSessionError.FridaSessionError,
    RpcSerialization.RpcSerialization | FridaScript.FridaScript
> => Layer.scoped(RpcClient.Protocol, makeProtocolFrida(options));
