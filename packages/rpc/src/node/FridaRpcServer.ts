/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import type * as Scope from "effect/Scope";

import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Queue from "effect/Queue";
import * as Stream from "effect/Stream";
import * as String from "effect/String";
import * as RpcMessage from "effect/unstable/rpc/RpcMessage";
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization";
import * as RpcServer from "effect/unstable/rpc/RpcServer";

import * as FridaScript from "@efffrida/frida-tools/FridaScript";

import * as constants from "../shared/Constants.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (): Effect.Effect<
    RpcServer.Protocol["Service"],
    never,
    FridaScript.FridaScript | RpcSerialization.RpcSerialization | Scope.Scope
> =>
    Effect.gen(function* () {
        const serialization = yield* RpcSerialization.RpcSerialization;
        const script = yield* FridaScript.FridaScript;

        const disconnects = yield* Queue.unbounded<number>();
        const parser = serialization.makeUnsafe();
        const encoder = new TextEncoder();

        let clientId = 0;
        const clientIds = new Set<number>();
        const clientIdsByExports = new Map<string, number>();
        const clients = new Map<
            number,
            {
                readonly write: (bytes: RpcMessage.FromServerEncoded) => void;
            }
        >();

        const stripPrefix = String.replace(constants.nodeRpcClientConnectionRequestMessagePrefix, "");
        const newClientPredicate: Predicate.Refinement<unknown, string> = Predicate.compose(
            Predicate.isString,
            String.startsWith(constants.nodeRpcClientConnectionRequestMessagePrefix)
        );
        const clientMessagePredicate: Predicate.Refinement<unknown, string> = Predicate.compose(
            Predicate.isString,
            (message) => clientIdsByExports.has(message)
        );

        let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;
        const makeRawWriter =
            (exportName: string) =>
            (data: string | Uint8Array): Effect.Effect<void> => {
                const transformed = typeof data === "string" ? encoder.encode(data) : data;
                return script.callExport(exportName)(transformed).pipe(Effect.orDie);
            };

        const onClientConnect = (message: string): Effect.Effect<void> => {
            const writeRaw = makeRawWriter(stripPrefix(message));
            const write = (response: RpcMessage.FromServerEncoded): Effect.Effect<void> => {
                try {
                    const encoded = parser.encode(response);
                    if (encoded === undefined) return Effect.void;
                    return writeRaw(encoded);
                } catch (cause) {
                    const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(cause))!;
                    return writeRaw(encoded);
                }
            };

            const id = ++clientId;
            clientIdsByExports.set(stripPrefix(message), id);
            clients.set(id, { write });
            clientIds.add(id);
            return Effect.void;
        };

        const onMessage = (exportName: string, data: Uint8Array): Effect.Effect<void> => {
            try {
                const id = clientIdsByExports.get(exportName)!;
                const decoded = parser.decode(data) as ReadonlyArray<RpcMessage.FromClientEncoded>;
                if (decoded.length === 0) return Effect.void;
                let i = 0;
                return Effect.whileLoop({
                    while: () => i < decoded.length,
                    step: Function.constVoid,
                    body() {
                        const message = decoded[i++];
                        return writeRequest(id, message);
                    },
                });
            } catch (cause) {
                const writeRaw = makeRawWriter(exportName);
                return writeRaw(parser.encode(RpcMessage.ResponseDefectEncoded(cause))!);
            }
        };

        yield* Stream.runForEach(script.stream, ({ message, data }) => {
            if (newClientPredicate(message)) return onClientConnect(message);
            if (clientMessagePredicate(message) && Option.isSome(data)) return onMessage(message, data.value);
            return Effect.void;
        }).pipe(Effect.forkScoped);

        return yield* RpcServer.Protocol.make((_writeRequest) => {
            writeRequest = _writeRequest;
            return Effect.succeed({
                disconnects,
                send: (clientId, response) => {
                    const client = clients.get(clientId);
                    if (!client) return Effect.void;
                    return Effect.sync(() => client.write(response));
                },
                end(_clientId) {
                    return Effect.void;
                },
                clientIds: Effect.sync(() => clientIds),
                initialMessage: Effect.succeedNone,
                supportsAck: true,
                supportsTransferables: false,
                supportsSpanPropagation: true,
            });
        });
    });

/**
 * @since 1.0.0
 * @category Layer
 */
export const layerProtocolFrida: Layer.Layer<
    RpcServer.Protocol,
    never,
    FridaScript.FridaScript | RpcSerialization.RpcSerialization
> = Layer.effect(RpcServer.Protocol, makeProtocolFrida());
