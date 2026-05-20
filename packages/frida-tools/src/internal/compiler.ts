import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Predicate from "effect/Predicate";

import * as Frida from "frida";

import * as FridaSessionError from "../FridaSessionError.ts";

// /** @internal */
// export const Compiler: Context.Reference<Frida.Compiler> = Context.Reference<Frida.Compiler>(
//     "@efffrida/frida-tools/compiler/default",
//     { defaultValue: () => new Frida.Compiler() }
// );

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
            const deviceManager = Frida.getDeviceManager();
            const compiler = new Frida.Compiler(deviceManager);

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
            const cancellable = new Frida.Cancellable();

            const compilerBuildOptions = {
                externals: options?.externals,
                projectRoot: options?.projectRoot,
                platform: options?.platform ?? Frida.JsPlatform.Gum,
                typeCheck: options?.typeCheck ?? Frida.TypeCheckMode.Full,
                sourceMaps: options?.sourceMaps ?? Frida.SourceMaps.Included,
                compression: options?.compression ?? Frida.JsCompression.None,
                bundleFormat: options?.bundleFormat ?? Frida.BundleFormat.Esm,
                outputFormat: options?.outputFormat ?? Frida.OutputFormat.Unescaped,
            };

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
                    if (compileErrors.length > 0) {
                        resume(
                            Effect.failCauseSync(() => {
                                const [first, ...rest] = compileErrors;
                                let cause = Cause.fail(formatDiagnostic(first));
                                for (const diag of rest) {
                                    cause = Cause.combine(cause, Cause.fail(formatDiagnostic(diag)));
                                }
                                return cause;
                            })
                        );
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
