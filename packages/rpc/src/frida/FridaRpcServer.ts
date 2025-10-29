/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import * as RpcMessage from "@effect/rpc/RpcMessage";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Mailbox from "effect/Mailbox";
import * as Predicate from "effect/Predicate";

import * as constants from "../shared/constants.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (
    options?:
        | {
              /** Generates server listener rpc exports for individual clients. */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Effect.Effect<
    {
        readonly protocol: RpcServer.Protocol["Type"];
        readonly rpcExport: () => Promise<number>;
    },
    never,
    RpcSerialization.RpcSerialization
> =>
    Effect.gen(function* () {
        const encoder = new TextEncoder();
        const disconnects = yield* Mailbox.make<number>();
        const serialization = yield* RpcSerialization.RpcSerialization;

        let clientId = 0;
        const clientIds = new Set<number>();
        const clients = new Map<number, { readonly write: (bytes: RpcMessage.FromServerEncoded) => void }>();

        let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;
        const exportName = options?.generateExportName ?? constants.generateServerExportNameForClient;

        // Listen for new clients on the main rpc export
        const rpcExport = Effect.gen(function* () {
            const id = clientId++;
            const parser = serialization.unsafeMake();

            const writeRaw = (data: string | Uint8Array): void => {
                const transformed = typeof data === "string" ? encoder.encode(data) : data;
                return send({ clientId: id }, (transformed as Uint8Array<ArrayBuffer>).buffer);
            };
            const write = (response: RpcMessage.FromServerEncoded): void => {
                try {
                    const encoded = parser.encode(response);
                    if (Predicate.isNotUndefined(encoded)) return writeRaw(encoded);
                } catch (cause) {
                    const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(cause))!;
                    return writeRaw(encoded);
                }
            };

            clientIds.add(id);
            clients.set(id, { write });

            const onMessage = (data: string | Uint8Array): Effect.Effect<void, never, never> => {
                try {
                    const decoded = parser.decode(data) as ReadonlyArray<RpcMessage.FromClientEncoded>;
                    if (decoded.length === 0) return Effect.void;
                    let i = 0;
                    return Effect.whileLoop({
                        while: () => i < decoded.length,
                        body() {
                            const message = decoded[i++];
                            return writeRequest(id, message);
                        },
                        step: Function.constVoid,
                    });
                } catch (cause) {
                    return Effect.sync(() => writeRaw(parser.encode(RpcMessage.ResponseDefectEncoded(cause))!));
                }
            };

            rpc.exports[exportName(clientId)] = (data: string | Uint8Array): Promise<void> =>
                Effect.runPromise(onMessage(data));

            return clientId;
        });

        const protocol = yield* RpcServer.Protocol.make((writeRequest_) => {
            writeRequest = writeRequest_;
            return Effect.succeed({
                disconnects,
                send: (clientId, response) => {
                    const client = clients.get(clientId);
                    if (!client) return Effect.void;
                    return Effect.sync(() => client.write(response));
                },
                end(clientId) {
                    clientIds.delete(clientId); // TODO: Is this required?
                    clients.delete(clientId); // TODO: Is this required?
                    const exportName = options?.generateExportName ?? constants.generateServerExportNameForClient;
                    delete rpc.exports[exportName(clientId)];
                    return Effect.void;
                },
                clientIds: Effect.sync(() => clientIds),
                initialMessage: Effect.succeedNone,
                supportsAck: true,
                supportsTransferables: false,
                supportsSpanPropagation: true,
            });
        });

        return {
            protocol,
            rpcExport: () => Effect.runPromise(rpcExport),
        };
    });

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFridaWithExport = (
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
): Effect.Effect<RpcServer.Protocol["Type"], never, RpcSerialization.RpcSerialization> =>
    Effect.gen(function* () {
        const { protocol, rpcExport } = yield* makeProtocolFrida({ generateExportName: options?.generateExportName });
        rpc.exports[options?.exportName ?? constants.defaultServerMainExportName] = rpcExport;
        return protocol;
    });

/**
 * @since 1.0.0
 * @category Layer
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
): Layer.Layer<RpcServer.Protocol, never, RpcSerialization.RpcSerialization> =>
    Layer.effect(RpcServer.Protocol, makeProtocolFridaWithExport(options));
