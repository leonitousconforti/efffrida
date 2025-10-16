/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports. The reason we don't use the send/recv script channels is because
 * those are shared channels by everybody.
 *
 * @since 1.0.0
 */

import * as RpcMessage from "@effect/rpc/RpcMessage";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Chunk from "effect/Chunk";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Mailbox from "effect/Mailbox";
import * as Predicate from "effect/Predicate";
import * as Runtime from "effect/Runtime";
import * as Tuple from "effect/Tuple";

import * as shared from "./shared.js";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida: Effect.Effect<
    {
        protocol: RpcServer.Protocol["Type"];
        rpcExport: (request: string | Uint8Array) => Promise<string | ReadonlyArray<number> | undefined>;
    },
    never,
    RpcSerialization.RpcSerialization
> = Effect.gen(function* () {
    const runtime = yield* Effect.runtime<never>();
    const disconnects = yield* Mailbox.make<number>();
    const serialization = yield* RpcSerialization.RpcSerialization;

    type Client = {
        readonly end: Effect.Effect<void, never, never>;
        readonly write: (bytes: RpcMessage.FromServerEncoded) => Effect.Effect<void>;
    };

    let clientId = 0;
    const clientIds = new Set<number>();
    const clients = new Map<number, Client>();
    let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;

    const rpcExport = async function (
        request: string | Uint8Array
    ): Promise<string | ReadonlyArray<number> | undefined> {
        const id = clientId++;
        const parser = serialization.unsafeMake();
        const mailbox = await Mailbox.make<RpcMessage.FromServerEncoded>().pipe(Runtime.runPromise(runtime));

        // When the implementation is done, do this with it's response
        clientIds.add(id);
        clients.set(id, {
            end: Effect.void,
            write: (response: RpcMessage.FromServerEncoded): Effect.Effect<boolean, never, never> =>
                Effect.zipLeft(
                    mailbox.offer(response),
                    Predicate.isTagged(response, "Chunk") ? Effect.void : mailbox.done(Exit.void)
                ),
        });

        // Parse the request and send it to the implementation
        try {
            const decoded = parser.decode(request) as ReadonlyArray<RpcMessage.FromClientEncoded>;
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
            const message = RpcMessage.ResponseDefectEncoded(cause);
            const encoded = parser.encode(message);
            return Predicate.isUint8Array(encoded) ? Array.from(encoded) : encoded;
        }

        // Wait for the implementation to respond
        const responses = await mailbox.await
            .pipe(Effect.flatMap(() => mailbox.takeAll))
            .pipe(Effect.map(Tuple.getFirst))
            .pipe(Effect.tap(mailbox.shutdown))
            .pipe(Effect.map(Chunk.toReadonlyArray))
            .pipe(Runtime.runPromise(runtime));

        // Encode the responses
        const chunks: Array<string | ReadonlyArray<number>> = [];
        for (const responseMessage of responses) {
            try {
                const encoded = parser.encode(responseMessage);
                if (Predicate.isUndefined(encoded)) continue;
                chunks.push(Predicate.isUint8Array(encoded) ? Array.from(encoded) : encoded);
            } catch (cause) {
                const message = RpcMessage.ResponseDefectEncoded(cause);
                const encoded = parser.encode(message);
                return Predicate.isUint8Array(encoded) ? Array.from(encoded) : encoded;
            }
        }

        // Concatenate the responses
        return Predicate.isString(chunks[0]) ? chunks.join("") : (chunks as Array<ReadonlyArray<number>>).flat();
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
            clientIds: Effect.sync(() => clientIds),
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
    options?: { readonly exportName?: string | undefined } | undefined
): Effect.Effect<RpcServer.Protocol["Type"], never, RpcSerialization.RpcSerialization> =>
    Effect.gen(function* () {
        const { protocol, rpcExport } = yield* makeProtocolFrida;
        rpc.exports[options?.exportName ?? shared.DEFAULT_EXPORT_NAME] = rpcExport;
        return protocol;
    });

/**
 * @since 1.0.0
 * @category Layer
 */
export const layerProtocolFrida = (
    options?: { readonly exportName?: string | undefined } | undefined
): Layer.Layer<RpcServer.Protocol, never, RpcSerialization.RpcSerialization> =>
    Layer.effect(RpcServer.Protocol, makeProtocolFridaWithExport(options));
