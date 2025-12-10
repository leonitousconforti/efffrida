/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import "@efffrida/polyfills";

import type * as RpcMessage from "@effect/rpc/RpcMessage";
import type * as Duration from "effect/Duration";
import type * as Scope from "effect/Scope";

import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as FridaStream from "@efffrida/platform/Stream";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as ParseResult from "effect/ParseResult";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";

import * as constants from "../shared/constants.ts";
import * as sharedPredicates from "../shared/predicates.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (
    options?:
        | {
              readonly generateExportName?: (() => string) | undefined;
              readonly receivingStreamShareOptions?:
                  | {
                        readonly capacity: "unbounded";
                        readonly replay?: number | undefined;
                        readonly idleTimeToLive?: Duration.DurationInput | undefined;
                    }
                  | {
                        readonly capacity: number;
                        readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
                        readonly replay?: number | undefined;
                        readonly idleTimeToLive?: Duration.DurationInput | undefined;
                    }
                  | undefined;
          }
        | undefined
): Effect.Effect<RpcClient.Protocol["Type"], never, RpcSerialization.RpcSerialization | Scope.Scope> =>
    RpcClient.Protocol.make(
        Effect.fnUntraced(function* (writeResponse) {
            const serialization = yield* RpcSerialization.RpcSerialization;

            const encoder = new TextEncoder();
            const parser = serialization.unsafeMake();

            /**
             * Once the server has acknowledged our initiation request and sent
             * use a client id to identify ourselves, this deferred will
             * complete.
             */
            const clientIdDeferred = yield* Deferred.make<number, ParseResult.ParseError>();

            /**
             * Setup the receiving handler for the client id. We receive the
             * client id over a script export instead of over the receiving
             * stream since there could be multiple clients in this frida script
             * and multiple could request client ids at the same time. This
             * could be mitigated with a nonce of some kind in the request
             * message, but receiving over a script export is full-proof so long
             * as the exports are unique.
             */
            const exportName = options?.generateExportName?.() ?? constants.generateClientCallbackExportNameForServer();
            yield* Effect.addFinalizer(() => Effect.sync(() => delete rpc.exports[exportName]));
            rpc.exports[exportName] = (maybeIncomingClientId: unknown): void => {
                const parsedClientId = Schema.decodeUnknown(Schema.Number)(maybeIncomingClientId);
                Deferred.unsafeDone(clientIdDeferred, parsedClientId);
            };

            /**
             * Request a client id from the node side and wait for the response,
             * handling any transient errors that might occur by retrying with
             * the retry policy.
             */
            const connectionRequest = constants.nodeRpcClientMakeConnectionRequestForServer(exportName);
            const connectionRequestTimeout: Duration.DurationInput = "1 second";
            const clientId = yield* Effect.sync(() => send(connectionRequest)).pipe(
                Effect.flatMap(() => Deferred.await(clientIdDeferred)),
                Effect.timeout(connectionRequestTimeout),
                Effect.catchIf(ParseResult.isParseError, () => Effect.dieMessage("Failed to parse client ID")),
                Effect.catchIf(Cause.isTimeoutException, () => Effect.dieMessage("Timed out too many times"))
            );

            /**
             * Attach to the receiving stream, where all future messages will
             * come in at, and filter for only our messages.
             */
            const receivingPredicate = sharedPredicates.isTaggedForClient(clientId);
            const receiveStream = yield* FridaStream.receiveStream(
                options?.receivingStreamShareOptions ?? {
                    replay: 100,
                    capacity: "unbounded",
                }
            );

            /**
             * For every response message received, decode it and send it the
             * response back to the implementation.
             */
            yield* receiveStream.pipe(
                Stream.filterMap((unfiltered) => {
                    if (receivingPredicate(unfiltered.message)) return Option.fromNullable(unfiltered.data);
                    else return Option.none<Uint8Array<ArrayBufferLike>>();
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
             * Sending messages is as simple as encoding them, then sending them
             * to the node side tagged with our client id so it knows where to
             * send them back to.
             */
            const sendHelper = Effect.fnUntraced(function* (message: RpcMessage.FromClientEncoded) {
                const encoded = parser.encode(message);
                if (Predicate.isUndefined(encoded)) return;
                const transformed = typeof encoded === "string" ? encoder.encode(encoded) : encoded;
                send({ clientId }, (transformed as Uint8Array<ArrayBuffer>).buffer);
            });

            return {
                send: sendHelper,
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
              readonly generateExportName?: (() => string) | undefined;
              readonly receivingStreamShareOptions?:
                  | {
                        readonly capacity: "unbounded";
                        readonly replay?: number | undefined;
                        readonly idleTimeToLive?: Duration.DurationInput | undefined;
                    }
                  | {
                        readonly capacity: number;
                        readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
                        readonly replay?: number | undefined;
                        readonly idleTimeToLive?: Duration.DurationInput | undefined;
                    }
                  | undefined;
          }
        | undefined
): Layer.Layer<RpcClient.Protocol, never, RpcSerialization.RpcSerialization> =>
    Layer.scoped(RpcClient.Protocol, makeProtocolFrida(options));
