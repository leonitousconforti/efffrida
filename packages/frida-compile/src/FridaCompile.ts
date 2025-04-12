/**
 * Compiles a Frida agent using tsup.
 *
 * @since 1.0.0
 */

import * as FileSystem from "@effect/platform/FileSystem";
import * as Path from "@effect/platform/Path";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Module from "node:module";
import * as Tsup from "tsup";

/**
 * @since 1.0.0
 * @category Compile
 */
export const compileAgent: (
    agentLocation: string | URL,
    tsconfig?: string | URL | undefined
) => Effect.Effect<string, never, FileSystem.FileSystem | Path.Path> = Effect.fn("compileAgent")(
    function* (agentLocation: string | URL, tsconfig?: string | URL | undefined) {
        const path = yield* Path.Path;
        const fileSystem = yield* FileSystem.FileSystem;
        const tempOutDir = yield* fileSystem.makeTempDirectoryScoped();

        const agentLocationString = yield* Predicate.isString(agentLocation)
            ? Effect.succeed(agentLocation)
            : path.fromFileUrl(agentLocation);

        const tsconfigLocationString = yield* Option.fromNullable(tsconfig)
            .pipe(Option.map((ts) => (Predicate.isString(ts) ? Effect.succeed(ts) : path.fromFileUrl(ts))))
            .pipe(Effect.transposeOption);

        yield* Effect.annotateCurrentSpan("agentLocation", agentLocationString);
        yield* Effect.annotateCurrentSpan("tsconfigLocation", tsconfigLocationString);
        const exists = yield* fileSystem.exists(agentLocationString);
        if (!exists) yield* Effect.dieMessage("Agent file not found");

        const agentFilename = path.basename(agentLocationString);
        const compiledAgentLocation = path.join(tempOutDir, agentFilename.replace(/\.ts$/, ".js"));

        const processShim = `
            import process from "@frida/process";
            export { process as "process" };
        `;
        const processShimFile = yield* path.fromFileUrl(new URL("./process.shim.js", import.meta.url));
        yield* fileSystem.writeFileString(processShimFile, processShim);

        const require = Module.createRequire(import.meta.url);
        const config = Tsup.defineConfig({
            ...(Option.isSome(tsconfigLocationString) ? { tsconfig: tsconfigLocationString.value } : {}),
            entry: [agentLocationString],
            outDir: tempOutDir,
            platform: "neutral",
            format: ["esm"],
            silent: true,
            dts: false,
            sourcemap: false,
            clean: true,
            treeshake: true,
            removeNodeProtocol: true,
            esbuildOptions(options) {
                options.define = { URL: "Url" };

                // Inject polyfills for Node.js built-in modules
                options.inject = [
                    processShimFile,
                    require.resolve("fast-text-encoding"),
                    require.resolve("@frida/assert"),
                    require.resolve("@frida/base64-js"),
                    require.resolve("@frida/buffer"),
                    require.resolve("@frida/crypto"),
                    require.resolve("@frida/diagnostics_channel"),
                    require.resolve("@frida/events"),
                    require.resolve("frida-fs"),
                    // require.resolve("@frida/http"),
                    // require.resolve("@frida/http-parser-js"),
                    // require.resolve("@frida/https"),
                    require.resolve("@frida/ieee754"),
                    // require.resolve("@frida/net"),
                    require.resolve("@frida/os"),
                    require.resolve("@frida/path"),
                    require.resolve("@frida/process"),
                    require.resolve("@frida/punycode"),
                    require.resolve("@frida/querystring"),
                    require.resolve("@frida/readable-stream"),
                    require.resolve("@frida/stream"),
                    require.resolve("@frida/string_decoder"),
                    // require.resolve("@frida/timers"),
                    require.resolve("@frida/tty"),
                    require.resolve("@frida/url"),
                    require.resolve("@frida/util"),
                    require.resolve("@frida/vm"),
                ];

                // Configure external packages (these will be required at runtime)
                options.external = ["msgpackr"];

                // Map Node.js and other modules to their @frida equivalents
                options.alias = {
                    assert: require.resolve("@frida/assert"),
                    "base64-js": require.resolve("@frida/base64-js"),
                    buffer: require.resolve("@frida/buffer"),
                    crypto: require.resolve("@frida/crypto"),
                    diagnostics_channel: require.resolve("@frida/diagnostics_channel"),
                    events: require.resolve("@frida/events"),
                    fs: require.resolve("frida-fs"),
                    // http: require.resolve("@frida/http"),
                    // 'http-parser-js': require.resolve("@frida/http-parser-js"),
                    // https: require.resolve("@frida/https"),
                    ieee754: require.resolve("@frida/ieee754"),
                    // net: require.resolve("@frida/net"),
                    os: require.resolve("@frida/os"),
                    path: require.resolve("@frida/path"),
                    process: require.resolve("@frida/process"),
                    punycode: require.resolve("@frida/punycode"),
                    querystring: require.resolve("@frida/querystring"),
                    "readable-stream": require.resolve("@frida/readable-stream"),
                    stream: require.resolve("@frida/stream"),
                    string_decoder: require.resolve("@frida/string_decoder"),
                    // timers: require.resolve("@frida/timers"),
                    tty: require.resolve("@frida/tty"),
                    url: require.resolve("@frida/url"),
                    util: require.resolve("@frida/util"),
                    vm: require.resolve("@frida/vm"),
                };
            },
        }) as Tsup.Options;

        yield* Effect.promise(() => Tsup.build(config));
        // const code = yield* fileSystem.readFileString(compiledAgentLocation);
        // yield* Effect.promise(() => Terser.minify(code, { compress: false, mangle: false }))
        //     .pipe(
        //         Effect.flatMap((result) =>
        //             Predicate.isUndefined(result.code)
        //                 ? Effect.dieMessage("Failed to minify code")
        //                 : Effect.succeed(result.code)
        //         )
        //     )
        //     .pipe(Effect.map((minified) => minified.replace('import*as Msgpackr from"msgpackr";', "")))
        //     .pipe(Effect.flatMap((minified) => fileSystem.writeFileString(compiledAgentLocation, minified)));

        return yield* fileSystem
            .readFileString(compiledAgentLocation)
            .pipe(Effect.map((minified) => minified.replace("import * as Msgpackr from 'msgpackr';", "")))
            .pipe(
                Effect.map((result) =>
                    result.replace(
                        'var setImmediate = "setImmediate" in globalThis ? globalThis.setImmediate : (f) => setTimeout(f, 0);',
                        ""
                    )
                )
            );
    },
    Effect.scoped,
    Effect.orDie
);
