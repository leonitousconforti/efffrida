/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports. The reason we don't use the send/recv script channels is because
 * those are shared channels by everybody.
 *
 * @since 1.0.0
 */

import type * as Types from "effect/Types";

import * as RpcMessage from "@effect/rpc/RpcMessage";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Mailbox from "effect/Mailbox";
import * as Predicate from "effect/Predicate";
import * as Runtime from "effect/Runtime";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida: Effect.Effect<
    {
        protocol: RpcServer.Protocol["Type"];
        rpcExport: (request: string | Uint8Array) => Promise<string | Uint8Array>;
    },
    never,
    RpcSerialization.RpcSerialization
> = Effect.gen(function* () {
    const runtime = yield* Effect.runtime<never>();
    const disconnects = yield* Mailbox.make<number>();
    const serialization = yield* RpcSerialization.RpcSerialization;

    let clientId = 0;
    const clients = new Map<
        number,
        {
            readonly end: Effect.Effect<void, never, never>;
            readonly write: (bytes: RpcMessage.FromServerEncoded) => Effect.Effect<void>;
        }
    >();
    let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;

    const rpcExport = async function (request: string | Uint8Array): Promise<string | Uint8Array> {
        const id = clientId++;
        const parser = serialization.unsafeMake();

        const deferred = await Runtime.runPromise(runtime, Deferred.make<string | Uint8Array, never>());
        clients.set(id, {
            end: Effect.void,
            write: (response: RpcMessage.FromServerEncoded) => {
                try {
                    if (!serialization.supportsBigInt && "requestId" in response) {
                        const mutable = response as Types.Mutable<typeof response>;
                        mutable.requestId = mutable.requestId.toString();
                    }
                    const encoded = parser.encode(response);
                    return Deferred.succeed(deferred, encoded);
                } catch (cause) {
                    const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(cause));
                    return Deferred.succeed(deferred, encoded);
                }
            },
        });

        try {
            const decoded = parser.decode(String(request)) as ReadonlyArray<RpcMessage.FromClientEncoded>;
            if (decoded.length === 0) return "";
            let i = 0;
            await Runtime.runPromise(
                runtime,
                Effect.whileLoop({
                    while: () => i < decoded.length,
                    body: () => writeRequest(id, decoded[i++]),
                    step: Function.constVoid,
                })
            );
        } catch (cause) {
            return Promise.resolve(parser.encode(RpcMessage.ResponseDefectEncoded(cause)));
        }

        return Runtime.runPromise(runtime, deferred);
    };

    const protocol = yield* RpcServer.Protocol.make((writeRequest_) => {
        writeRequest = writeRequest_;
        return Effect.succeed({
            disconnects,
            send: (clientId, response) => {
                const client = clients.get(clientId);
                if (!client) return Effect.void;
                return client.write(response);
            },
            end(clientId) {
                const client = clients.get(clientId);
                if (!client) return Effect.void;
                clients.delete(clientId);
                return client.end;
            },
            initialMessage: Effect.succeedNone,
            supportsAck: false,
            supportsTransferables: false,
            supportsSpanPropagation: false,
        });
    });

    return { protocol, rpcExport };
});

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFridaWithExport = (
    options?:
        | {
              readonly exportName?: string | undefined;
              readonly messageOnRpcAvailable?: string | undefined;
          }
        | undefined
) =>
    Effect.gen(function* () {
        const { protocol, rpcExport } = yield* makeProtocolFrida;
        rpc.exports[options?.exportName ?? "rpc"] = rpcExport;
        const messageOnRpcAvailable = options?.messageOnRpcAvailable;
        if (Predicate.isNotUndefined(messageOnRpcAvailable)) {
            send(messageOnRpcAvailable);
        }
        return protocol;
    });

/**
 * @since 1.0.0
 * @category Layer
 */
export const layerProtocolFrida = (
    options?:
        | {
              readonly exportName?: string | undefined;
              readonly onRpcAvailable?: string | undefined;
          }
        | undefined
): Layer.Layer<RpcServer.Protocol, never, RpcSerialization.RpcSerialization> =>
    Layer.effect(RpcServer.Protocol, makeProtocolFridaWithExport(options));
