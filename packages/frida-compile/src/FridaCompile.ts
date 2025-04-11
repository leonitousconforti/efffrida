/**
 * Compiles a Frida agent using tsup.
 *
 * @since 1.0.0
 */

import * as FileSystem from "@effect/platform/FileSystem";
import * as Path from "@effect/platform/Path";
import * as Effect from "effect/Effect";
import * as Predicate from "effect/Predicate";
import * as String from "effect/String";
import * as module from "node:module";
import * as tsup from "tsup";

/**
 * @since 1.0.0
 * @category Compile
 */
export const compileAgent: (
    agentLocation: string | URL
) => Effect.Effect<string, never, FileSystem.FileSystem | Path.Path> = Effect.fn("compileAgent")(
    function* (agentLocation: string | URL) {
        const path = yield* Path.Path;
        const fileSystem = yield* FileSystem.FileSystem;
        const tempOutDir = yield* fileSystem.makeTempDirectory();

        const agentLocationString = yield* Predicate.isString(agentLocation)
            ? Effect.succeed(agentLocation)
            : path.fromFileUrl(agentLocation);

        const agentFilename = path.basename(agentLocationString);
        const compiledAgentLocation = path.join(tempOutDir, agentFilename.replace(/\.ts$/, ".js"));
        console.log(compiledAgentLocation);

        const exists = yield* fileSystem.exists(agentLocationString);
        if (!exists) yield* Effect.dieMessage("Compiled agent not found");

        const require = module.createRequire(import.meta.url);
        const config = tsup.defineConfig({
            entry: [agentLocationString],
            outDir: tempOutDir,
            format: ["esm"],
            silent: true,
            dts: false,
            sourcemap: false,
            clean: true,
            treeshake: true,
            splitting: false,
            minify: false,
            removeNodeProtocol: true,
            esbuildOptions(options) {
                options.define = { URL: "Url" };
                options.mainFields = ["browser", "module", "main"];

                // Inject polyfills for Node.js built-in modules
                options.inject = [
                    require.resolve("fast-text-encoding"),
                    require.resolve("@frida/assert"),
                    require.resolve("@frida/base64-js"),
                    require.resolve("@frida/buffer"),
                    require.resolve("@frida/crosspath"),
                    require.resolve("@frida/crypto"),
                    require.resolve("@frida/diagnostics_channel"),
                    require.resolve("@frida/events"),
                    require.resolve("frida-fs"),
                    require.resolve("@frida/http"),
                    // require.resolve("@frida/http-parser-js"),
                    require.resolve("@frida/https"),
                    require.resolve("@frida/ieee754"),
                    require.resolve("@frida/net"),
                    require.resolve("@frida/os"),
                    require.resolve("@frida/path"),
                    require.resolve("@frida/process"),
                    require.resolve("@frida/punycode"),
                    require.resolve("@frida/querystring"),
                    require.resolve("@frida/readable-stream"),
                    require.resolve("@frida/reserved-words"),
                    require.resolve("@frida/stream"),
                    require.resolve("@frida/string_decoder"),
                    require.resolve("@frida/terser"),
                    require.resolve("@frida/timers"),
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
                    crosspath: require.resolve("@frida/crosspath"),
                    crypto: require.resolve("@frida/crypto"),
                    diagnostics_channel: require.resolve("@frida/diagnostics_channel"),
                    events: require.resolve("@frida/events"),
                    fs: require.resolve("frida-fs"),
                    http: require.resolve("@frida/http"),
                    // "http-parser-js": require.resolve("@frida/http-parser-js"),
                    https: require.resolve("@frida/https"),
                    ieee754: require.resolve("@frida/ieee754"),
                    net: require.resolve("@frida/net"),
                    os: require.resolve("@frida/os"),
                    path: require.resolve("@frida/path"),
                    process: require.resolve("@frida/process"),
                    punycode: require.resolve("@frida/punycode"),
                    querystring: require.resolve("@frida/querystring"),
                    "readable-stream": require.resolve("@frida/readable-stream"),
                    "reserved-words": require.resolve("@frida/reserved-words"),
                    stream: require.resolve("@frida/stream"),
                    string_decoder: require.resolve("@frida/string_decoder"),
                    terser: require.resolve("@frida/terser"),
                    timers: require.resolve("@frida/timers"),
                    tty: require.resolve("@frida/tty"),
                    url: require.resolve("@frida/url"),
                    util: require.resolve("@frida/util"),
                    vm: require.resolve("@frida/vm"),
                };
            },
        }) as tsup.Options;

        yield* Effect.promise(() => tsup.build(config));
        return yield* fileSystem
            .readFileString(compiledAgentLocation)
            .pipe(
                Effect.map(
                    String.replace(
                        'var setImmediate = "setImmediate" in globalThis ? globalThis.setImmediate : (f) => setTimeout(f, 0);',
                        String.empty
                    )
                )
            );
    },
    Effect.scoped,
    Effect.orDie
);
