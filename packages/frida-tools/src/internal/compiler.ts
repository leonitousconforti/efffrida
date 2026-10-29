import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Function from "effect/Function";
import * as Predicate from "effect/Predicate";
import * as Queue from "effect/Queue";
import * as Stream from "effect/Stream";

import * as Frida from "frida";

import * as FridaSessionError from "../FridaSessionError.ts";

/** @internal */
export const Compiler: Context.Reference<Frida.Compiler> = Context.Reference<Frida.Compiler>(
    "@efffrida/frida-tools/compiler/default",
    { defaultValue: () => new Frida.Compiler() }
);

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

const diagnosticsCause = (
    compileErrors: readonly [Diagnostic, ...Array<Diagnostic>]
): Cause.Cause<FridaSessionError.FridaSessionError> => {
    const [first, ...rest] = compileErrors;
    let cause = Cause.fail(formatDiagnostic(first));
    for (const diag of rest) {
        cause = Cause.combine(cause, Cause.fail(formatDiagnostic(diag)));
    }
    return cause;
};

const makeBuildOptions = (options?: Frida.CompilerOptions | undefined) => ({
    externals: options?.externals,
    projectRoot: options?.projectRoot,
    platform: options?.platform ?? Frida.JsPlatform.Gum,
    typeCheck: options?.typeCheck ?? Frida.TypeCheckMode.Full,
    sourceMaps: options?.sourceMaps ?? Frida.SourceMaps.Included,
    compression: options?.compression ?? Frida.JsCompression.None,
    bundleFormat: options?.bundleFormat ?? Frida.BundleFormat.Esm,
    outputFormat: options?.outputFormat ?? Frida.OutputFormat.Unescaped,
});

/** @internal */
export const compile = Function.dual<
    (
        options?: Frida.CompilerOptions | undefined
    ) => (path: string) => Effect.Effect<string, FridaSessionError.FridaSessionError, never>,
    (
        path: string,
        options?: Frida.CompilerOptions | undefined
    ) => Effect.Effect<string, FridaSessionError.FridaSessionError, never>
>(
    (arguments_) => Predicate.isString(arguments_[0]),
    (path: string, options?: Frida.CompilerOptions | undefined) =>
        Effect.gen(function* () {
            const compiler = new Frida.Compiler();
            const compileErrors: Array<Diagnostic> = [];
            const cancellable = new Frida.Cancellable();
            const compilerBuildOptions = makeBuildOptions(options);

            return yield* Effect.callback<string, FridaSessionError.FridaSessionError, never>((resume) => {
                const onOutput = (bundle: string) => {
                    disconnectAll();
                    resume(Effect.succeed(bundle));
                };

                const onDiagnostic = (diagnostic: Array<Diagnostic>) => {
                    for (const diag of diagnostic) {
                        if (diag.category === "error") {
                            compileErrors.push(diag);
                        }
                    }
                };

                const onFinished = () => {
                    disconnectAll();
                    if (Array.isArrayNonEmpty(compileErrors)) {
                        resume(Effect.failCauseSync(() => diagnosticsCause(compileErrors)));
                    }
                };

                compiler.output.connect(onOutput);
                compiler.diagnostics.connect(onDiagnostic);
                compiler.finished.connect(onFinished);
                const disconnectAll = () => {
                    compiler.output.disconnect(onOutput);
                    compiler.diagnostics.disconnect(onDiagnostic);
                    compiler.finished.disconnect(onFinished);
                };

                compiler.build(path, compilerBuildOptions, cancellable).catch((cause) => {
                    disconnectAll();
                    resume(
                        new FridaSessionError.FridaSessionError({
                            when: "compile",
                            cause,
                        })
                    );
                });

                return Effect.sync(() => {
                    disconnectAll();
                    cancellable.cancel();
                });
            });
        })
);

/**
 * Watches the entrypoint and all of its dependencies, emitting one exit per
 * build: the bundle on success, or the compile errors on failure.
 *
 * @internal
 */
export const watch = (
    path: string,
    options?: Frida.CompilerOptions | undefined
): Stream.Stream<Exit.Exit<string, FridaSessionError.FridaSessionError>, FridaSessionError.FridaSessionError, never> =>
    Stream.callback<Exit.Exit<string, FridaSessionError.FridaSessionError>, FridaSessionError.FridaSessionError>(
        (queue) =>
            Effect.acquireRelease(
                Effect.sync(() => {
                    const compiler = new Frida.Compiler();
                    const cancellable = new Frida.Cancellable();

                    // Same semantics as compile: an output is a successful
                    // build, a build that finishes with errors and without
                    // output is a failed build.
                    let compileErrors: Array<Diagnostic> = [];
                    let emitted = false;

                    const onStarting = () => {
                        compileErrors = [];
                        emitted = false;
                    };

                    const onDiagnostic = (diagnostic: Array<Diagnostic>) => {
                        for (const diag of diagnostic) {
                            if (diag.category === "error") {
                                compileErrors.push(diag);
                            }
                        }
                    };

                    const onOutput = (bundle: string) => {
                        emitted = true;
                        Queue.offerUnsafe(queue, Exit.succeed(bundle));
                    };

                    const onFinished = () => {
                        if (!emitted && Array.isArrayNonEmpty(compileErrors)) {
                            Queue.offerUnsafe(queue, Exit.failCause(diagnosticsCause(compileErrors)));
                        }
                        compileErrors = [];
                        emitted = false;
                    };

                    compiler.starting.connect(onStarting);
                    compiler.output.connect(onOutput);
                    compiler.diagnostics.connect(onDiagnostic);
                    compiler.finished.connect(onFinished);

                    compiler.watch(path, makeBuildOptions(options), cancellable).catch((cause) => {
                        Queue.failCauseUnsafe(
                            queue,
                            Cause.fail(new FridaSessionError.FridaSessionError({ when: "watch", cause }))
                        );
                    });

                    return () => {
                        compiler.starting.disconnect(onStarting);
                        compiler.output.disconnect(onOutput);
                        compiler.diagnostics.disconnect(onDiagnostic);
                        compiler.finished.disconnect(onFinished);
                        cancellable.cancel();
                    };
                }),
                (teardown) => Effect.sync(teardown)
            )
    );
