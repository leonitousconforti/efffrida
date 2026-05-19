/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import type * as Scope from "effect/Scope";
import type * as RpcMessage from "effect/unstable/rpc/RpcMessage";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Result from "effect/Result";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import * as RpcClient from "effect/unstable/rpc/RpcClient";
import * as RpcClientError from "effect/unstable/rpc/RpcClientError";
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization";

import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";

import * as FridaScript from "@efffrida/frida-tools/FridaScript";

import * as constants from "../shared/Constants.ts";

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
          }
        | undefined
): Effect.Effect<
    RpcClient.Protocol["Service"],
    FridaSessionError.FridaSessionError,
    RpcSerialization.RpcSerialization | FridaScript.FridaScript | Scope.Scope
> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse, clientIds) {
            const script = yield* FridaScript.FridaScript;
            const serialization = yield* RpcSerialization.RpcSerialization;

            const mainExportName = options?.exportName ?? constants.defaultServerMainExportName;
            const informServerToSetupExport = script.callExport(mainExportName, Schema.String);
            const clientExportName = yield* Effect.orDie(informServerToSetupExport());

            const parser = serialization.makeUnsafe();
            const requestClientMap = new Map<string, number>();
            let currentError: RpcClientError.RpcClientError | undefined = undefined;

            const broadcast = (response: RpcMessage.FromServerEncoded) =>
                Effect.forEach(clientIds, (clientId) => writeResponse(clientId, response));

            yield* Stream.runForEach(script.stream, (message) => {
                if (Option.isNone(message.data)) {
                    return Effect.void;
                }

                try {
                    const responses = parser.decode(message.data.value) as Array<RpcMessage.FromServerEncoded>;
                    if (responses.length === 0) return Effect.void;
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
                    });
                } catch (defect) {
                    return broadcast({
                        _tag: "ClientProtocolError",
                        error: new RpcClientError.RpcClientError({
                            reason: new RpcClientError.RpcClientDefect({
                                message: "Error decoding message",
                                cause: defect,
                            }),
                        }),
                    });
                }
            }).pipe(
                Effect.tapCause((cause) => {
                    const error = Cause.findError(cause);
                    const hasError = Result.isSuccess(error);
                    const defect = hasError
                        ? new RpcClientError.RpcClientDefect({
                              message: error.success.message,
                              cause: error.success.cause,
                          })
                        : new RpcClientError.RpcClientDefect({
                              message: "Unknown error in Frida RPC client stream",
                              cause: Cause.squash(cause),
                          });

                    currentError = new RpcClientError.RpcClientError({ reason: defect });
                    return broadcast({ _tag: "ClientProtocolError", error: currentError });
                }),
                Effect.forkScoped
            );

            return {
                supportsAck: true,
                supportsTransferables: false,
                send(clientId, request) {
                    if (currentError) {
                        return Effect.fail(currentError);
                    }

                    if (request._tag === "Request") {
                        requestClientMap.set(request.id, clientId);
                    }

                    const encoded = parser.encode(request);
                    if (encoded === undefined) return Effect.void;
                    return Effect.orDie(script.callExport(clientExportName)(encoded));
                },
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
               * connecting to to inform the script of their client id.
               */
              readonly exportName?: string | undefined;
          }
        | undefined
): Layer.Layer<
    RpcClient.Protocol,
    FridaSessionError.FridaSessionError,
    RpcSerialization.RpcSerialization | FridaScript.FridaScript
> => Layer.effect(RpcClient.Protocol, makeProtocolFrida(options));
