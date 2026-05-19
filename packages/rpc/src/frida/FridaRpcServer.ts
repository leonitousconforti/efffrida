/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import "@efffrida/polyfills";

import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Queue from "effect/Queue";
import * as RpcMessage from "effect/unstable/rpc/RpcMessage";
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization";
import * as RpcServer from "effect/unstable/rpc/RpcServer";

import * as constants from "../shared/Constants.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFridaNoSendRecv = (
    options?:
        | {
              /** Generates server listener rpc exports for individual clients. */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Effect.Effect<
    {
        readonly protocol: RpcServer.Protocol["Service"];
        readonly rpcExport: () => Promise<string>;
    },
    never,
    RpcSerialization.RpcSerialization
> =>
    Effect.gen(function* () {
        const serialization = yield* RpcSerialization.RpcSerialization;

        const disconnects = yield* Queue.unbounded<number>();
        const parser = serialization.makeUnsafe();
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

        const writeRaw = (data: string | Uint8Array): void => {
            const transformed = typeof data === "string" ? encoder.encode(data) : data;
            return send(void 0, (transformed as Uint8Array<ArrayBuffer>).buffer);
        };

        const write = (response: RpcMessage.FromServerEncoded): void => {
            try {
                const encoded = parser.encode(response);
                if (encoded === undefined) return;
                return writeRaw(encoded);
            } catch (cause) {
                const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(cause))!;
                return writeRaw(encoded);
            }
        };

        // @effect-diagnostics-next-line runEffectInsideEffect:off
        const rpcExport = Effect.gen(function* () {
            const id = ++clientId;
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
                    return Effect.sync(() => writeRaw(parser.encode(RpcMessage.ResponseDefectEncoded(cause))!));
                }
            };

            rpc.exports[makeExportName(id)] = (data: string | Record<number, string>): Promise<void> =>
                Effect.runPromise(onMessage(data));

            return makeExportName(id);
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
                    delete rpc.exports[makeExportName(clientId)];
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

              /** Generates server listener rpc exports for individual clients. */
              readonly generateExportName?: ((clientId: number) => string) | undefined;
          }
        | undefined
): Effect.Effect<RpcServer.Protocol["Service"], never, RpcSerialization.RpcSerialization> =>
    Effect.gen(function* () {
        const protocolOptions = { generateExportName: options?.generateExportName };
        const { protocol, rpcExport } = yield* makeProtocolFridaNoSendRecv(protocolOptions);
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
    Layer.effect(RpcServer.Protocol, makeProtocolFrida(options));
