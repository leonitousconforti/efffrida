import type * as Scope from "effect/Scope";
import type * as FridaScript from "../FridaScript.js";

import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Queue from "effect/Queue";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as Take from "effect/Take";
import * as Frida from "frida";
import * as FridaDevice from "../FridaDevice.js";
import * as FridaSession from "../FridaSession.js";
import * as FridaSessionError from "../FridaSessionError.js";

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
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) => (
        source: string | Buffer
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
    >,
    (
        source: string | Buffer,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
    >
>(
    (arguments_) => Predicate.isString(arguments_[0]) || Buffer.isBuffer(arguments_[0]),
    Effect.fnUntraced(
        function* (
            source: string | Buffer,
            options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
        ) {
            const { device } = yield* FridaDevice.FridaDevice;
            const { session } = yield* FridaSession.FridaSession;

            const script = Predicate.isString(source)
                ? yield* Effect.tryPromise({
                      try: () => session.createScript(source, { runtime: Frida.ScriptRuntime.V8, ...options }),
                      catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "compile" }),
                  })
                : yield* Effect.tryPromise({
                      try: () => session.createScriptFromBytes(source, { runtime: Frida.ScriptRuntime.V8, ...options }),
                      catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "compile" }),
                  });

            const messageQueue =
                yield* Queue.unbounded<
                    Take.Take<{ message: any; data: Option.Option<Buffer> }, FridaSessionError.FridaSessionError>
                >();

            const messageHandler: Frida.ScriptMessageHandler = (message: Frida.Message, data: Buffer | null): void => {
                switch (message.type) {
                    case Frida.MessageType.Error: {
                        // const cause = {
                        //     stack: message.stack,
                        //     fileName: message.fileName,
                        //     lineNumber: message.lineNumber,
                        //     columnNumber: message.columnNumber,
                        //     description: message.description,
                        // };
                        const error = new Error(message.description);
                        error.stack = message.stack ?? "";
                        const asTake = Take.fail(
                            new FridaSessionError.FridaSessionError({
                                when: "message",
                                cause: error,
                            })
                        );
                        Queue.unsafeOffer(messageQueue, asTake);
                        break;
                    }

                    case Frida.MessageType.Send: {
                        const asTake = Take.of({ message: message.payload, data: Option.fromNullable(data) });
                        Queue.unsafeOffer(messageQueue, asTake);
                        break;
                    }

                    default:
                        Function.absurd(message);
                }
            };

            const disconnectMessageHandler = Effect.sync(() => script.message.disconnect(messageHandler));
            yield* Effect.addFinalizer(() => Effect.flatMap(messageQueue.shutdown, () => disconnectMessageHandler));
            script.message.connect(messageHandler);

            const stream = Stream.fromQueue(messageQueue).pipe(Stream.flattenTake);
            const sink = Sink.forEach<{ message: any; data: Option.Option<Buffer> }, void, never, never>(
                ({ data, message }) => Effect.sync(() => script.post(message, Option.getOrNull(data)))
            );

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
                script,
                stream,
                sink,
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
        source: string | Buffer
    ) => Layer.Layer<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        FridaSession.FridaSession | FridaDevice.FridaDevice
    >,
    (
        source: string | Buffer,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) => Layer.Layer<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        FridaSession.FridaSession | FridaDevice.FridaDevice
    >
>(
    (arguments_) => Predicate.isString(arguments_[0]),
    (
        source: string | Buffer,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) => Layer.scoped(Tag, load(source, options))
);
