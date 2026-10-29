/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import "@efffrida/polyfills";

import type * as Scope from "effect/Scope";

import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Queue from "effect/Queue";
import * as RpcMessage from "effect/rpc/RpcMessage";
import * as RpcSerialization from "effect/rpc/RpcSerialization";
import * as RpcServer from "effect/rpc/RpcServer";
import * as Schema from "effect/Schema";

import * as constants from "../shared/Constants.ts";

/** Encodes defects like effect's own server protocols, so errors survive
 * serialization. */
const makeDefectEncoder = (codecFor: RpcSerialization.CodecFor): ((defect: unknown) => unknown) =>
    Schema.encodeSync(codecFor(Schema.Defect()));

/** Copies only the bytes covered by the view, not its whole backing buffer. */
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? (bytes.buffer as ArrayBuffer)
        : (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFridaNoSendRecv = (
    options?:
        | {
              /**
               * Generates server listener rpc exports for individual clients.
               */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Effect.Effect<
    {
        readonly protocol: RpcServer.Protocol["Service"];
        readonly rpcExport: () => Promise<string>;
    },
    never,
    RpcSerialization.RpcSerialization | Scope.Scope
> =>
    Effect.gen(function* () {
        const serialization = yield* RpcSerialization.RpcSerialization;
        const encodeDefect = makeDefectEncoder(serialization.codecFor);

        const disconnects = yield* Queue.unbounded<number>();
        const encoder = new TextEncoder();

        let clientId = 0;
        const clientIds = new Set<number>();
        const clients = new Map<
            number,
            {
                readonly write: (bytes: RpcMessage.FromServerEncoded) => void;
            }
        >();

        let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;
        const makeExportName = options?.generateExportName ?? constants.generateServerExportNameForClient;

        const removeClient = (id: number): void => {
            delete rpc.exports[makeExportName(id)];
            clients.delete(id);
            clientIds.delete(id);
        };

        yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
                for (const id of clientIds) removeClient(id);
            })
        );

        const rpcExport = Effect.gen(function* () {
            const id = ++clientId;
            const exportName = makeExportName(id);
            const responseMessage = constants.fridaRpcServerMakeResponseMessageForClient(exportName);
            const parser = serialization.makeUnsafe();

            const writeRaw = (data: string | Uint8Array): void => {
                const transformed = typeof data === "string" ? encoder.encode(data) : data;
                return send(responseMessage, toArrayBuffer(transformed));
            };

            const write = (response: RpcMessage.FromServerEncoded): void => {
                try {
                    const encoded = parser.encode(response);
                    if (encoded === undefined) return;
                    return writeRaw(encoded);
                } catch (cause) {
                    return writeRaw(parser.encode(RpcMessage.ResponseDefectEncoded(encodeDefect(cause)))!);
                }
            };

            clients.set(id, { write });
            clientIds.add(id);

            const onMessage = (input: string | Record<number, string>): Effect.Effect<void, never, never> => {
                try {
                    const data = typeof input === "string" ? input : Uint8Array.from(Object.values(input));
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
                    return Effect.sync(() => write(RpcMessage.ResponseDefectEncoded(encodeDefect(cause))));
                }
            };

            rpc.exports[exportName] = (data: string | Record<number, string>): Promise<void> =>
                // @effect-diagnostics-next-line runEffectInsideEffect:off
                Effect.runPromise(onMessage(data));

            return exportName;
            // @effect-diagnostics-next-line runEffectInsideEffect:off
        }).pipe((export_) => () => Effect.runPromise(export_));

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
                    return Effect.sync(() => removeClient(clientId));
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

        return {
            protocol,
            rpcExport,
        };
    });

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

              /**
               * Generates server listener rpc exports for individual clients
               */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Effect.Effect<RpcServer.Protocol["Service"], never, RpcSerialization.RpcSerialization | Scope.Scope> =>
    Effect.gen(function* () {
        const protocolOptions = { generateExportName: options?.generateExportName };
        const { protocol, rpcExport } = yield* makeProtocolFridaNoSendRecv(protocolOptions);
        const mainExportName = options?.exportName ?? constants.defaultServerMainExportName;
        yield* Effect.addFinalizer(() => Effect.sync(() => delete rpc.exports[mainExportName]));
        rpc.exports[mainExportName] = rpcExport;
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

              /**
               * Generates server listener rpc exports for individual clients.
               */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Layer.Layer<RpcServer.Protocol, never, RpcSerialization.RpcSerialization> =>
    Layer.effect(RpcServer.Protocol, makeProtocolFrida(options));
