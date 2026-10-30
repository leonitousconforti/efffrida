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
import * as RpcMessage from "effect/rpc/RpcMessage";
import * as RpcSerialization from "effect/rpc/RpcSerialization";
import * as RpcServer from "effect/rpc/RpcServer";
import * as Stream from "effect/Stream";
import * as String from "effect/String";

import * as FridaScript from "@efffrida/frida-tools/FridaScript";

import * as constants from "../shared/Constants.ts";
import * as internalDefect from "../shared/internal/defect.ts";
import * as internalBytes from "./internal/bytes.ts";

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
        const encodeDefect = internalDefect.makeDefectEncoder(serialization.codecFor);

        const disconnects = yield* Queue.unbounded<number>();

        let clientId = 0;
        const clientIds = new Set<number>();
        const clientIdsByExports = new Map<string, number>();
        const clients = new Map<
            number,
            {
                readonly parser: RpcSerialization.Parser;
                readonly write: (bytes: RpcMessage.FromServerEncoded) => Effect.Effect<void>;
            }
        >();

        const stripConnectionPrefix = String.replace(constants.nodeRpcClientConnectionRequestMessagePrefix, "");
        const stripDisconnectionPrefix = String.replace(constants.nodeRpcClientDisconnectionRequestMessagePrefix, "");
        const newClientPredicate: Predicate.Refinement<unknown, string> = Predicate.compose(
            Predicate.isString,
            String.startsWith(constants.nodeRpcClientConnectionRequestMessagePrefix)
        );
        const clientDisconnectPredicate: Predicate.Refinement<unknown, string> = Predicate.compose(
            Predicate.isString,
            String.startsWith(constants.nodeRpcClientDisconnectionRequestMessagePrefix)
        );
        const clientMessagePredicate: Predicate.Refinement<unknown, string> = Predicate.compose(
            Predicate.isString,
            (message) => clientIdsByExports.has(message)
        );

        let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;
        const makeRawWriter = (exportName: string) => {
            const callExport = script.callExport(exportName);
            return (data: string | Uint8Array): Effect.Effect<void> =>
                callExport(typeof data === "string" ? data : internalBytes.toBuffer(data)).pipe(Effect.orDie);
        };

        const onClientConnect = (message: string): Effect.Effect<void> => {
            const exportName = stripConnectionPrefix(message);
            const writeRaw = makeRawWriter(exportName);
            const parser = serialization.makeUnsafe();
            const write = (response: RpcMessage.FromServerEncoded): Effect.Effect<void> => {
                try {
                    const encoded = parser.encode(response);
                    if (encoded === undefined) return Effect.void;
                    return writeRaw(encoded);
                } catch (cause) {
                    const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(encodeDefect(cause)))!;
                    return writeRaw(encoded);
                }
            };

            const id = ++clientId;
            clientIdsByExports.set(exportName, id);
            clients.set(id, { parser, write });
            clientIds.add(id);
            return Effect.void;
        };

        const removeClient = (exportName: string, id: number): Effect.Effect<void> => {
            clientIdsByExports.delete(exportName);
            clients.delete(id);
            clientIds.delete(id);
            return Queue.offer(disconnects, id);
        };

        const onClientDisconnect = (message: string): Effect.Effect<void> => {
            const exportName = stripDisconnectionPrefix(message);
            const id = clientIdsByExports.get(exportName);
            if (id === undefined) return Effect.void;
            return removeClient(exportName, id);
        };

        const onMessage = (exportName: string, data: Uint8Array): Effect.Effect<void> => {
            const id = clientIdsByExports.get(exportName);
            const client = id === undefined ? undefined : clients.get(id);
            if (id === undefined || client === undefined) return Effect.void;
            try {
                const decoded = client.parser.decode(data) as ReadonlyArray<RpcMessage.FromClientEncoded>;
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
                return client.write(RpcMessage.ResponseDefectEncoded(encodeDefect(cause)));
            }
        };

        const disconnectAll = Effect.suspend(() =>
            Effect.forEach(Array.from(clientIdsByExports), ([exportName, id]) => removeClient(exportName, id), {
                discard: true,
            })
        );

        yield* Stream.runForEach(script.stream, ({ message, data }) => {
            if (newClientPredicate(message)) return onClientConnect(message);
            if (clientDisconnectPredicate(message)) return onClientDisconnect(message);
            if (clientMessagePredicate(message) && Option.isSome(data)) return onMessage(message, data.value);
            return Effect.void;
        }).pipe(Effect.tapError(Effect.logError), Effect.ensuring(disconnectAll), Effect.forkScoped);

        return yield* RpcServer.Protocol.make((_writeRequest) => {
            writeRequest = _writeRequest;
            return Effect.succeed({
                disconnects,
                send: (clientId, response) => {
                    const client = clients.get(clientId);
                    if (!client) return Effect.void;
                    return client.write(response);
                },
                end(_clientId) {
                    return Effect.void;
                },
                clientIds: Effect.sync(() => clientIds),
                initialMessage: Effect.succeedNone,
                supportsAck: true,
                supportsTransferables: false,
                supportsSpanPropagation: true,
                supportsNotifications: true,
                codecFor: serialization.codecFor,
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
