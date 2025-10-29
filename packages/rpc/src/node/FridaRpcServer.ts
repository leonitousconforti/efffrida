/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports.
 *
 * @since 1.0.0
 */

import type * as Scope from "effect/Scope";

import * as RpcMessage from "@effect/rpc/RpcMessage";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Mailbox from "effect/Mailbox";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import * as String from "effect/String";
import * as Tuple from "effect/Tuple";

import * as constants from "../shared/constants.ts";
import * as predicates from "../shared/predicates.ts";

/**
 * @since 1.0.0
 * @category Protocol
 */
export const makeProtocolFrida = (): Effect.Effect<
    unknown,
    never,
    FridaScript.FridaScript | RpcSerialization.RpcSerialization | Scope.Scope
> =>
    Effect.gen(function* () {
        const encoder = new TextEncoder();
        const script = yield* FridaScript.FridaScript;
        const serialization = yield* RpcSerialization.RpcSerialization;

        let clientId = 0;
        const clientIds = new Set<number>();
        const parser = serialization.unsafeMake();
        const disconnects = yield* Mailbox.make<number>();

        let writeRequest!: (clientId: number, message: RpcMessage.FromClientEncoded) => Effect.Effect<void>;

        // Listen for new clients
        yield* script.stream.pipe(
            Stream.filterMap(({ message }) => {
                if (predicates.newClientPredicate(message)) {
                    const stripPrefix = String.replace(constants.nodeRpcClientConnectionRequestMessagePrefix, "");
                    return Option.some(stripPrefix(message));
                } else {
                    return Option.none();
                }
            }),
            Stream.runForEach((exportName) => {
                const id = clientId++;
                clientIds.add(id);
                return script.callExport(exportName, Schema.Void)(clientId++);
            }),
            Stream.tapError(Console.error),
            Stream.runDrain,
            Effect.forkScoped
        );

        // Listen for messages from connected clients
        yield* script.stream.pipe(
            Stream.filterMap(({ data: maybeData, message }) => {
                if (predicates.isTaggedForAnyClient(message)) {
                    return Option.map(maybeData, (data) => Tuple.make(message.clientId, data));
                } else {
                    return Option.none();
                }
            }),
            Stream.runForEach(([clientId, data]) => {
                try {
                    const decoded = parser.decode(data) as ReadonlyArray<RpcMessage.FromClientEncoded>;
                    if (decoded.length === 0) return Effect.void;
                    let i = 0;
                    return Effect.whileLoop({
                        while: () => i < decoded.length,
                        body() {
                            const message = decoded[i++];
                            return writeRequest(clientId, message);
                        },
                        step: Function.constVoid,
                    });
                } catch (cause) {
                    return Effect.sync(() => {
                        const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(cause))!;
                        const transformed = typeof encoded === "string" ? encoder.encode(encoded) : encoded;
                        script.script.post({ clientId }, Buffer.from(transformed));
                    });
                }
            }),
            Stream.tapError(Console.error),
            Stream.runDrain,
            Effect.forkScoped
        );

        return yield* RpcServer.Protocol.make((_writeRequest) => {
            writeRequest = _writeRequest;
            return Effect.succeed({
                disconnects,
                send: (clientId, response) => {
                    const writeRaw = (data: string | Uint8Array) => {
                        const transformed = typeof data === "string" ? encoder.encode(data) : data;
                        script.script.post({ clientId }, Buffer.from(transformed));
                        return Effect.void;
                    };

                    try {
                        const encoded = parser.encode(response);
                        if (Predicate.isNotUndefined(encoded)) return writeRaw(encoded);
                        else return Effect.void;
                    } catch (cause) {
                        const encoded = parser.encode(RpcMessage.ResponseDefectEncoded(cause))!;
                        return writeRaw(encoded);
                    }
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
