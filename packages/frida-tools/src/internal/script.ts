import type * as Scope from "effect/Scope";

import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as FileSystem from "effect/FileSystem";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import * as Predicate from "effect/Predicate";
import * as Queue from "effect/Queue";
import * as Schema from "effect/Schema";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

import type * as FridaScript from "../FridaScript.ts";

import * as Frida from "frida";

import * as FridaSession from "../FridaSession.ts";
import * as FridaSessionError from "../FridaSessionError.ts";
import * as internalCompiler from "./compiler.ts";

/** @internal */
export const FridaScriptTypeId: FridaScript.FridaScriptTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaScript"
) as FridaScript.FridaScriptTypeId;

/** @internal */
export const Tag = Context.Service<FridaScript.FridaScript>("@efffrida/frida-tools/FridaScript");

/** @internal */
export const isFridaScript = (u: unknown): u is FridaScript.FridaScript => Predicate.hasProperty(u, FridaScriptTypeId);

/** @internal */
export const load = Function.dual<
    (
        options?: FridaScript.LoadOptions | undefined
    ) => (
        entrypoint: URL | string
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >,
    (
        entrypoint: URL | string,
        options?: FridaScript.LoadOptions | undefined
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], "href") || Predicate.isString(arguments_[0]),
    Effect.fnUntraced(function* (entrypoint: URL | string, options?: FridaScript.LoadOptions | undefined) {
        const path = yield* Path.Path;
        const { session } = yield* FridaSession.FridaSession;

        const entrypointString = Predicate.isString(entrypoint)
            ? entrypoint
            : yield* path.fromFileUrl(entrypoint).pipe(
                  Effect.mapError(
                      (cause) =>
                          new FridaSessionError.FridaSessionError({
                              when: "compile",
                              cause,
                          })
                  )
              );

        const projectRoot = path.dirname(entrypointString);

        const source = yield* internalCompiler
            .compile(entrypointString, {
                ...options,
                projectRoot: options?.projectRoot ?? projectRoot,
            })
            .pipe(
                Effect.timeoutOrElse({
                    duration: "1 minute",
                    orElse: () =>
                        new FridaSessionError.FridaSessionError({
                            cause: "Compilation timed out",
                            when: "compile",
                        }),
                })
            );

        const script = yield* Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return session.createScript(
                    source,
                    {
                        runtime: Frida.ScriptRuntime.V8,
                        ...options,
                    },
                    cancellable
                );
            },
            catch: (cause) =>
                new FridaSessionError.FridaSessionError({
                    when: "compile",
                    cause,
                }),
        });

        yield* Effect.addFinalizer(() =>
            Effect.promise((signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return script.unload(cancellable);
            })
        );

        const scriptError = yield* Deferred.make<unknown, never>();
        const destroyed = yield* Deferred.make<void, never>();

        const queue = yield* Queue.make<
            { message: unknown; data: Option.Option<Buffer> },
            FridaSessionError.FridaSessionError
        >(options?.messageMailboxCapacity);
        yield* Effect.addFinalizer(() => Queue.shutdown(queue));

        const destroyedHandler: Frida.ScriptDestroyedHandler = () => {
            Deferred.doneUnsafe(destroyed, Exit.void);
            Queue.failCauseUnsafe(
                queue,
                Cause.fail(
                    new FridaSessionError.FridaSessionError({
                        cause: "Script destroyed",
                        when: "message",
                    })
                )
            );
        };
        yield* Effect.addFinalizer(() => Effect.sync(() => script.destroyed.disconnect(destroyedHandler)));
        script.destroyed.connect(destroyedHandler);

        const messageHandler: Frida.ScriptMessageHandler = (message: Frida.Message, data: Buffer | null): void => {
            switch (message.type) {
                case Frida.MessageType.Error: {
                    const cause = new Error();
                    cause.name = "FridaScriptDefect";
                    cause.stack = message.stack ?? "";
                    cause.message = message.description.replace(/^\w{0,}: /, "") ?? "";
                    Deferred.doneUnsafe(scriptError, Exit.succeed(cause));
                    Queue.failCauseUnsafe(
                        queue,
                        Cause.fail(
                            new FridaSessionError.FridaSessionError({
                                when: "message",
                                cause,
                            })
                        )
                    );
                    break;
                }

                case Frida.MessageType.Send: {
                    Queue.offerUnsafe(queue, {
                        message: message.payload,
                        data: Option.fromNullishOr(data),
                    });
                    break;
                }

                default: {
                    return Function.absurd(message);
                }
            }
        };
        yield* Effect.addFinalizer(() => Effect.sync(() => script.message.disconnect(messageHandler)));
        script.message.connect(messageHandler);

        const failIfScriptError = Effect.fnUntraced(function* (when: FridaSessionError.FridaSessionError["when"]) {
            const isDone = yield* Deferred.isDone(scriptError);
            if (!isDone) return yield* Effect.void;
            const cause = yield* Deferred.await(scriptError);
            return yield* new FridaSessionError.FridaSessionError({
                cause,
                when,
            });
        });

        const failIfDestroyed = Effect.fnUntraced(function* (when: FridaSessionError.FridaSessionError["when"]) {
            const isDone = yield* Deferred.isDone(destroyed);
            if (!isDone) return yield* Effect.void;
            return yield* new FridaSessionError.FridaSessionError({
                cause: "Script is destroyed",
                when,
            });
        });

        const stream = yield* Stream.share(
            Stream.fromQueue(queue),
            options?.streamShareOptions ?? {
                strategy: "suspend",
                capacity: 100,
                replay: 100,
            }
        );

        const sink = Sink.forEach<
            { message: unknown; data: Option.Option<Buffer> },
            void,
            FridaSessionError.FridaSessionError,
            never
        >(
            Effect.fnUntraced(function* ({ data, message }) {
                yield* failIfDestroyed("message");
                yield* failIfScriptError("message");
                script.post(message, Option.getOrNull(data));
            })
        );

        const callExport = <A = unknown, R = never>(exportName: string, schema?: Schema.Decoder<A, R> | undefined) =>
            Effect.fn(`call frida export ${exportName}`)(function* (
                ...args: Array<any>
            ): Effect.fn.Return<A, FridaSessionError.FridaSessionError | Schema.SchemaError, R> {
                yield* Effect.annotateCurrentSpan("args", args);
                yield* failIfDestroyed("rpcCall");
                yield* failIfScriptError("rpcCall");
                const result = yield* Effect.tryPromise({
                    try: () => script.exports[exportName](...args),
                    catch: (cause) =>
                        new FridaSessionError.FridaSessionError({
                            when: "rpcCall",
                            cause,
                        }),
                });
                yield* Effect.annotateCurrentSpan("result", result);
                const decoder = Schema.decodeEffect(schema ?? Schema.Unknown);
                const decoded = yield* decoder(result);
                return decoded as A;
            });

        yield* Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return script.load(cancellable);
            },
            catch: (cause) =>
                new FridaSessionError.FridaSessionError({
                    when: "load",
                    cause,
                }),
        });

        return {
            sink,
            stream,
            script,
            destroyed,
            callExport,
            scriptError,
            [FridaScriptTypeId]: FridaScriptTypeId,
        } as const;
    })
);

/** @internal */
export const layer = Function.dual<
    (
        options?: FridaScript.LoadOptions | undefined
    ) => (
        entrypoint: URL | string
    ) => Layer.Layer<FridaScript.FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>,
    (
        entrypoint: URL | string,
        options?: FridaScript.LoadOptions | undefined
    ) => Layer.Layer<FridaScript.FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], "href") || Predicate.isString(arguments_[0]),
    (entrypoint: URL | string, options?: FridaScript.LoadOptions | undefined) =>
        Layer.effect(Tag, load(entrypoint, options)).pipe(Layer.provide(Path.layer))
);

/** @internal */
export const watch = Function.dual<
    (
        entrypoint: URL | string,
        options?: FridaScript.LoadOptions | undefined
    ) => <A, E, R>(
        effect: Effect.Effect<A, E, R>
    ) => Stream.Stream<
        Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
        FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript.FridaScript>
    >,
    <A, E, R>(
        effect: Effect.Effect<A, E, R>,
        entrypoint: URL | string,
        options?: FridaScript.LoadOptions | undefined
    ) => Stream.Stream<
        Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
        FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript.FridaScript>
    >
>(
    (arguments_) => Effect.isEffect(arguments_[0]),
    Effect.fnUntraced(
        function* <A, E, R>(
            effect: Effect.Effect<A, E, R>,
            entrypoint: URL | string,
            options?: FridaScript.LoadOptions | undefined
        ): Effect.fn.Return<
            Stream.Stream<
                Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
                FridaSessionError.FridaSessionError,
                Path.Path | FridaSession.FridaSession | Exclude<R, FridaScript.FridaScript>
            >,
            FridaSessionError.FridaSessionError,
            Path.Path | FileSystem.FileSystem
        > {
            const path = yield* Path.Path;
            const fileSystem = yield* FileSystem.FileSystem;

            const entrypointString = Predicate.isString(entrypoint)
                ? entrypoint
                : yield* path.fromFileUrl(entrypoint).pipe(
                      Effect.mapError(
                          (cause) =>
                              new FridaSessionError.FridaSessionError({
                                  when: "watch",
                                  cause,
                              })
                      )
                  );

            return fileSystem.watch(entrypointString).pipe(
                Stream.filter((event) => event._tag === "Update"),
                Stream.prepend([{ _tag: "Update" as const, path: entrypointString }]),
                Stream.debounce("2 second"),
                Stream.mapError(
                    (cause) =>
                        new FridaSessionError.FridaSessionError({
                            when: "watch",
                            cause,
                        })
                ),
                Stream.tap((event) => Effect.logDebug(`reloading ${event.path}`)),
                Stream.mapEffect(() =>
                    effect.pipe(
                        Effect.provideServiceEffect(Tag, load(entrypoint, options)),
                        Effect.interruptible,
                        Effect.scoped,
                        Effect.exit
                    )
                ),
                Stream.tap((_exit) => Effect.logDebug(`script reloaded`))
            );
        },
        Stream.unwrap,
        Stream.provide(Path.layer)
    )
);

/** @internal */
export const logWatchErrors = <A, E1, E2, R>(
    watchStream: Stream.Stream<Exit.Exit<A, E1>, E2, R>
): Stream.Stream<Exit.Exit<A, E1>, E2, R> =>
    Stream.tap(watchStream, (exit) => {
        // Success
        if (Exit.isSuccess(exit)) {
            return Effect.logInfo(exit.value);
        }

        // Non-success
        const cause = exit.cause;

        // Interruption only
        if (Cause.hasInterruptsOnly(cause)) {
            return Effect.logDebug("Script interrupted with no errors");
        }

        // Defect
        if (Cause.hasDies(cause)) {
            return Effect.logError(cause);
        }

        // Error
        return Effect.logWarning(cause);
    });
