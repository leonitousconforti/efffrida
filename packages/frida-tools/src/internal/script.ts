import type * as Scope from "effect/Scope";
import type * as FridaScript from "../FridaScript.js";

import * as Path from "@effect/platform/Path";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Mailbox from "effect/Mailbox";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Sink from "effect/Sink";
import * as Frida from "frida";
import * as FridaDevice from "../FridaDevice.js";
import * as FridaSession from "../FridaSession.js";
import * as FridaSessionError from "../FridaSessionError.js";

/** @internal */
const compiler = new Frida.Compiler();

/** @internal */
export const FridaScriptTypeId: FridaScript.FridaScriptTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaScript"
) as FridaScript.FridaScriptTypeId;

/** @internal */
export const Tag = Context.GenericTag<FridaScript.FridaScript>("@efffrida/frida-tools/FridaScript");

/** @internal */
export const isFridaScript = (u: unknown): u is FridaScript.FridaScript => Predicate.hasProperty(u, FridaScriptTypeId);

/** @internal */
export const load = Function.dual<
    (
        options?:
            | (Frida.ScriptOptions & {
                  readonly resume?: boolean | undefined;
                  readonly messageMailboxCapacity?:
                      | number
                      | {
                            readonly capacity?: number;
                            readonly strategy?: "suspend" | "dropping" | "sliding";
                        }
                      | undefined;
              })
            | undefined
    ) => (
        entrypoint: URL
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
    >,
    (
        entrypoint: URL,
        options?:
            | (Frida.ScriptOptions & {
                  readonly resume?: boolean | undefined;
                  readonly messageMailboxCapacity?:
                      | number
                      | {
                            readonly capacity?: number;
                            readonly strategy?: "suspend" | "dropping" | "sliding";
                        }
                      | undefined;
              })
            | undefined
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
    >
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], "href"),
    Effect.fnUntraced(
        function* (
            entrypoint: URL,
            options?:
                | (Frida.ScriptOptions & {
                      readonly resume?: boolean | undefined;
                      readonly messageMailboxCapacity?:
                          | number
                          | {
                                readonly capacity?: number;
                                readonly strategy?: "suspend" | "dropping" | "sliding";
                            }
                          | undefined;
                  })
                | undefined
        ) {
            const path = yield* Path.Path;
            const { device } = yield* FridaDevice.FridaDevice;
            const { session } = yield* FridaSession.FridaSession;

            const source = yield* path
                .fromFileUrl(entrypoint)
                .pipe(
                    Effect.flatMap((path) =>
                        Effect.tryPromise(() =>
                            compiler.build(path, {
                                typeCheck: "full",
                                compression: "none",
                                bundleFormat: "esm",
                                outputFormat: "unescaped",
                                sourceMaps: Frida.SourceMaps.Included,
                            })
                        )
                    )
                )
                .pipe(Effect.mapError((cause) => new FridaSessionError.FridaSessionError({ cause, when: "compile" })));

            const script = yield* Effect.tryPromise({
                catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "compile" }),
                try: () => session.createScript(source, { runtime: Frida.ScriptRuntime.V8, ...options }),
            });

            const messageMailbox = yield* Mailbox.make<
                { message: unknown; data: Option.Option<Buffer> },
                FridaSessionError.FridaSessionError
            >(options?.messageMailboxCapacity);

            let scriptDefectCause: unknown = undefined;
            const messageHandler: Frida.ScriptMessageHandler = (message: Frida.Message, data: Buffer | null): void => {
                switch (message.type) {
                    case Frida.MessageType.Error: {
                        const cause = new Error();
                        cause.name = "FridaScriptDefect";
                        cause.stack = message.stack ?? "";
                        cause.message = message.description.replace(/^\w{0,}: /, "") ?? "";
                        scriptDefectCause = cause;
                        messageMailbox.unsafeDone(
                            Exit.fail(
                                new FridaSessionError.FridaSessionError({
                                    cause,
                                    when: "message",
                                })
                            )
                        );
                        break;
                    }

                    case Frida.MessageType.Send: {
                        messageMailbox.unsafeOffer({
                            message: message.payload,
                            data: Option.fromNullable(data),
                        });
                        break;
                    }

                    default:
                        Function.absurd(message);
                }
            };

            const disconnectMessageHandler = Effect.sync(() => script.message.disconnect(messageHandler));
            yield* Effect.addFinalizer(() => Effect.flatMap(messageMailbox.shutdown, () => disconnectMessageHandler));
            script.message.connect(messageHandler);

            const stream = Mailbox.toStream(messageMailbox);
            const sink = Sink.forEach<
                { message: unknown; data: Option.Option<Buffer> },
                void,
                FridaSessionError.FridaSessionError,
                never
            >(({ data, message }) => {
                if (Predicate.isNotUndefined(scriptDefectCause)) {
                    return Effect.fail(
                        new FridaSessionError.FridaSessionError({
                            when: "message",
                            cause: scriptDefectCause,
                        })
                    );
                } else {
                    return Effect.sync(() => script.post(message, Option.getOrNull(data)));
                }
            });

            const destroyed = yield* Deferred.make<void, never>();
            const destroyedHandler = () => Deferred.unsafeDone(destroyed, Effect.void);
            script.destroyed.connect(destroyedHandler);

            const callExport = (exportName: string) =>
                Effect.fn(`call frida export ${exportName}`)(function* (...args: Array<any>) {
                    yield* Effect.annotateCurrentSpan("args", args);

                    const isDestroyed = yield* Deferred.isDone(destroyed);
                    if (isDestroyed) {
                        return yield* new FridaSessionError.FridaSessionError({
                            when: "rpcCall",
                            cause: "Script is destroyed",
                        });
                    }

                    if (Predicate.isNotUndefined(scriptDefectCause)) {
                        return yield* new FridaSessionError.FridaSessionError({
                            when: "rpcCall",
                            cause: scriptDefectCause,
                        });
                    }

                    const result = yield* Effect.tryPromise({
                        try: () => script.exports[exportName](...args) as Promise<unknown>,
                        catch: (cause) => new FridaSessionError.FridaSessionError({ when: "rpcCall", cause }),
                    });

                    yield* Effect.annotateCurrentSpan("result", result);
                    return result;
                });

            yield* Effect.tryPromise({
                try: () => script.load(),
                catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "load" }),
            });

            if (options?.resume === true) {
                yield* Effect.tryPromise({
                    try: () => device.resume(session.pid),
                    catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "resume" }),
                });
            }

            return {
                sink,
                script,
                stream,
                destroyed,
                callExport,
                [FridaScriptTypeId]: FridaScriptTypeId,
            } as const;
        },
        Effect.acquireRelease(({ script }: FridaScript.FridaScript) => Effect.promise(() => script.unload()))
    )
);

/** @internal */
export const layer = Function.dual<
    (
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) => (
        entrypoint: URL
    ) => Layer.Layer<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | FridaDevice.FridaDevice
    >,
    (
        entrypoint: URL,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) => Layer.Layer<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | FridaDevice.FridaDevice
    >
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], "href"),
    (entrypoint: URL, options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined) =>
        Layer.scoped(Tag, load(entrypoint, options))
);
