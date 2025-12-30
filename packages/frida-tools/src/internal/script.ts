import type * as Scope from "effect/Scope";
import type * as FridaScript from "../FridaScript.ts";

import * as FileSystem from "@effect/platform/FileSystem";
import * as Path from "@effect/platform/Path";
import * as Cause from "effect/Cause";
import * as Chunk from "effect/Chunk";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import * as Exit from "effect/Exit";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Mailbox from "effect/Mailbox";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as Frida from "frida";

import * as FridaSession from "../FridaSession.ts";
import * as FridaSessionError from "../FridaSessionError.ts";

/** @internal */
export const FridaScriptTypeId: FridaScript.FridaScriptTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaScript"
) as FridaScript.FridaScriptTypeId;

/** @internal */
export const Tag = Context.GenericTag<FridaScript.FridaScript>("@efffrida/frida-tools/FridaScript");

/** @internal */
export const isFridaScript = (u: unknown): u is FridaScript.FridaScript => Predicate.hasProperty(u, FridaScriptTypeId);

/** @internal */
export const compile = Function.dual<
    (
        options?: Frida.CompilerOptions | undefined
    ) => (path: string) => Effect.Effect<string, FridaSessionError.FridaSessionError, Scope.Scope>,
    (
        path: string,
        options?: Frida.CompilerOptions | undefined
    ) => Effect.Effect<string, FridaSessionError.FridaSessionError, Scope.Scope>
>(
    (arguments_) => Predicate.isString(arguments_[0]),
    (path: string, options?: Frida.CompilerOptions | undefined) =>
        Effect.asyncEffect<string, FridaSessionError.FridaSessionError, never, never, never, Scope.Scope>(
            Effect.fnUntraced(function* (resume) {
                // https://github.com/frida/frida-compile/blob/e81ae27369466c69868fc6ee36c0f227bbfe340c/src/cli.ts#L173-L182
                interface Diagnostic {
                    category: string;
                    code: number;
                    text: string;
                    file?: {
                        path: string;
                        line: number;
                        character: number;
                    };
                }

                const formatDiagnostic = (diagnostic: Diagnostic): FridaSessionError.FridaSessionError => {
                    const location = diagnostic.file
                        ? `${diagnostic.file.path}:${diagnostic.file.line}:${diagnostic.file.character}`
                        : undefined;
                    const message = `TS${diagnostic.code}: ${diagnostic.text}`;
                    const cause = location ? `${location} - ${message}` : message;
                    return new FridaSessionError.FridaSessionError({ cause, when: "compile" });
                };

                const compileErrors: Array<Diagnostic> = [];
                const compiler = new Frida.Compiler();

                const onOutput = (bundle: string) => resume(Effect.succeed(bundle));
                yield* Effect.addFinalizer(() => Effect.sync(() => compiler.output.disconnect(onOutput)));
                compiler.output.connect(onOutput);

                const onDiagnostic = (diagnostic: Array<Diagnostic>) => {
                    for (const diag of diagnostic) {
                        if (diag.category === "error") {
                            compileErrors.push(diag);
                        }
                    }
                };
                yield* Effect.addFinalizer(() => Effect.sync(() => compiler.diagnostics.disconnect(onDiagnostic)));
                compiler.diagnostics.connect(onDiagnostic);

                const onFinished = () => {
                    if (compileErrors.length > 0) {
                        resume(
                            Effect.failCauseSync(() => {
                                const [first, ...rest] = compileErrors;
                                let cause = Cause.fail(formatDiagnostic(first));
                                for (const diag of rest) {
                                    cause = Cause.parallel(cause, Cause.fail(formatDiagnostic(diag)));
                                }
                                return cause;
                            })
                        );
                    }
                };
                yield* Effect.addFinalizer(() => Effect.sync(() => compiler.finished.disconnect(onFinished)));
                compiler.finished.connect(onFinished);

                const cancellable = new Frida.Cancellable();
                compiler
                    .build(
                        path,
                        {
                            externals: options?.externals,
                            projectRoot: options?.projectRoot,
                            platform: options?.platform ?? Frida.JsPlatform.Gum,
                            typeCheck: options?.typeCheck ?? Frida.TypeCheckMode.Full,
                            sourceMaps: options?.sourceMaps ?? Frida.SourceMaps.Included,
                            compression: options?.compression ?? Frida.JsCompression.None,
                            bundleFormat: options?.bundleFormat ?? Frida.BundleFormat.Esm,
                            outputFormat: options?.outputFormat ?? Frida.OutputFormat.Unescaped,
                        },
                        cancellable
                    )
                    .catch((error) =>
                        resume(
                            Effect.fail(
                                new FridaSessionError.FridaSessionError({
                                    cause: error,
                                    when: "compile",
                                })
                            )
                        )
                    );

                return Effect.sync(() => cancellable.cancel());
            })
        )
);

/** @internal */
export const load = Function.dual<
    (
        options?: FridaScript.LoadOptions | undefined
    ) => (
        entrypoint: URL
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >,
    (
        entrypoint: URL,
        options?: FridaScript.LoadOptions | undefined
    ) => Effect.Effect<
        FridaScript.FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], "href"),
    Effect.fnUntraced(
        function* (entrypoint: URL, options?: FridaScript.LoadOptions | undefined) {
            const path = yield* Path.Path;
            const { session } = yield* FridaSession.FridaSession;

            const projectRoot = yield* path
                .fromFileUrl(entrypoint)
                .pipe(
                    Effect.mapError(
                        (cause) =>
                            new FridaSessionError.FridaSessionError({
                                when: "compile",
                                cause,
                            })
                    )
                )
                .pipe(Effect.map((p) => path.dirname(p)));

            const source = yield* path
                .fromFileUrl(entrypoint)
                .pipe(
                    Effect.flatMap(
                        compile({
                            ...options,
                            projectRoot: options?.projectRoot ?? projectRoot,
                        })
                    )
                )
                .pipe(Effect.scoped)
                .pipe(
                    Effect.timeoutFail({
                        duration: "1 minute",
                        onTimeout: () =>
                            new FridaSessionError.FridaSessionError({
                                when: "compile",
                                cause: "TypeScript compilation timed out",
                            }),
                    })
                )
                .pipe(
                    Effect.catchTag(
                        "BadArgument",
                        (platformCause) =>
                            new FridaSessionError.FridaSessionError({
                                when: "compile",
                                cause: platformCause,
                            })
                    )
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
                        cause,
                        when: "compile",
                    }),
            });

            const destroyed = yield* Deferred.make<void, never>();
            const scriptError = yield* Deferred.make<unknown, never>();
            const mailbox = yield* Mailbox.make<
                { message: unknown; data: Option.Option<Buffer> },
                FridaSessionError.FridaSessionError
            >(options?.messageMailboxCapacity);
            yield* Effect.addFinalizer(() => mailbox.shutdown); // TODO: is this needed?

            const destroyedHandler: Frida.ScriptDestroyedHandler = () => {
                Deferred.unsafeDone(destroyed, Effect.void);
                mailbox.unsafeDone(
                    Exit.fail(
                        new FridaSessionError.FridaSessionError({
                            when: "message",
                            cause: "Script destroyed",
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
                        Deferred.unsafeDone(scriptError, Exit.succeed(cause));
                        mailbox.unsafeDone(
                            Exit.fail(
                                new FridaSessionError.FridaSessionError({
                                    when: "message",
                                    cause,
                                })
                            )
                        );
                        break;
                    }

                    case Frida.MessageType.Send: {
                        mailbox.unsafeOffer({
                            message: message.payload,
                            data: Option.fromNullable(data),
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

            const failIfScriptError = (when: FridaSessionError.FridaSessionError["when"]) =>
                Effect.if(Deferred.isDone(scriptError), {
                    onFalse: () => Effect.void,
                    onTrue: () =>
                        Effect.flatMap(
                            Deferred.await(scriptError),
                            (cause) => new FridaSessionError.FridaSessionError({ cause, when })
                        ),
                });

            const failIfDestroyed = (when: FridaSessionError.FridaSessionError["when"]) =>
                Effect.if(Deferred.isDone(destroyed), {
                    onFalse: () => Effect.void,
                    onTrue: () => new FridaSessionError.FridaSessionError({ cause: "Script is destroyed", when }),
                });

            const stream = yield* Stream.share(
                Mailbox.toStream(mailbox),
                options?.streamShareOptions ?? {
                    replay: 100,
                    capacity: "unbounded",
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

            const callExport = <A, I, R>(exportName: string, schema: Schema.Schema<A, I, R>) =>
                Effect.fn(`call frida export ${exportName}`)(function* (...args: Array<any>) {
                    yield* Effect.annotateCurrentSpan("args", args);
                    yield* failIfDestroyed("rpcCall");
                    yield* failIfScriptError("rpcCall");
                    const result = yield* Effect.tryPromise({
                        try: () => script.exports[exportName](...args) as Promise<unknown>,
                        catch: (cause) => new FridaSessionError.FridaSessionError({ when: "rpcCall", cause }),
                    });
                    yield* Effect.annotateCurrentSpan("result", result);
                    return yield* Schema.decodeUnknown(schema)(result);
                });

            yield* Effect.tryPromise({
                try: (signal) => {
                    const cancellable = new Frida.Cancellable();
                    signal.onabort = () => cancellable.cancel();
                    return script.load(cancellable);
                },
                catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "load" }),
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
        },
        Effect.acquireRelease(({ script }: FridaScript.FridaScript) =>
            Effect.promise((signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return script.unload(cancellable);
            })
        )
    )
);

/** @internal */
export const layer = Function.dual<
    (
        options?: FridaScript.LoadOptions | undefined
    ) => (
        entrypoint: URL
    ) => Layer.Layer<FridaScript.FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>,
    (
        entrypoint: URL,
        options?: FridaScript.LoadOptions | undefined
    ) => Layer.Layer<FridaScript.FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], "href"),
    (entrypoint: URL, options?: FridaScript.LoadOptions | undefined) =>
        Layer.scoped(Tag, load(entrypoint, options)).pipe(Layer.provide(Path.layer))
);

/** @internal */
export const watch = Function.dual<
    (
        entrypoint: URL,
        options?: FridaScript.LoadOptions | undefined
    ) => <A, E, R>(
        effect: Effect.Effect<A, E, R>
    ) => Stream.Stream<
        Either.Either<Exit.Exit<A, E>, unknown>,
        FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript.FridaScript>
    >,
    <A, E, R>(
        effect: Effect.Effect<A, E, R>,
        entrypoint: URL,
        options?: FridaScript.LoadOptions | undefined
    ) => Stream.Stream<
        Either.Either<Exit.Exit<A, E>, unknown>,
        FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript.FridaScript>
    >
>(
    (arguments_) => Effect.isEffect(arguments_[0]),
    Effect.fnUntraced(
        function* <A, E, R>(
            effect: Effect.Effect<A, E, R>,
            entrypoint: URL,
            options?: FridaScript.LoadOptions | undefined
        ): Effect.fn.Return<
            Stream.Stream<
                Either.Either<Exit.Exit<A, E>, unknown>,
                FridaSessionError.FridaSessionError,
                Path.Path | FridaSession.FridaSession | Exclude<R, FridaScript.FridaScript>
            >,
            FridaSessionError.FridaSessionError,
            Path.Path | FileSystem.FileSystem
        > {
            const path = yield* Path.Path;
            const fileSystem = yield* FileSystem.FileSystem;

            const pathString = yield* Effect.mapError(
                path.fromFileUrl(entrypoint),
                (cause) =>
                    new FridaSessionError.FridaSessionError({
                        when: "watch",
                        cause,
                    })
            );

            return fileSystem.watch(pathString).pipe(
                Stream.filter((event) => event._tag === "Update"),
                Stream.prepend(Chunk.of(FileSystem.WatchEventUpdate({ path: pathString }))),
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
                        Effect.exit,
                        Effect.map(Either.right),
                        Effect.provideServiceEffect(Tag, load(entrypoint, options)),
                        Effect.catchAllDefect(Function.compose(Either.left, Effect.succeed)),
                        Effect.scoped
                    )
                ),
                Stream.tap((_exit) => Effect.logDebug(`script reloaded`))
            );
        },
        Stream.unwrap,
        Stream.provideSomeLayer(Path.layer)
    )
);
