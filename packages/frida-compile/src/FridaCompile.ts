/**
 * Compiles a Frida agent using tsup.
 *
 * @since 1.0.0
 */

import * as FileSystem from "@effect/platform/FileSystem";
import * as Path from "@effect/platform/Path";
import * as Terser from "@frida/terser";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as String from "effect/String";
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
        const processShimFile = yield* fileSystem.makeTempFileScoped();
        yield* fileSystem.writeFileString(processShimFile, processShim);

        const timersShim = `
            class Timeout {
                constructor(id, clearFn) {
                    this._id = id;
                    this._clearFn = clearFn;
                }

                ref() {}

                unref() {}

                close() {
                    this._clearFn(this._id);
                    this._id = null;
                }
            }

            function fridaSetTimeout(...args) {
                return new Timeout(globalThis.setTimeout(...args), globalThis.clearTimeout);
            }

            function fridaSetInterval(...args) {
                return new Timeout(globalThis.setInterval(...args), globalThis.clearInterval);
            }

            function fridaClearTimeout(timeout) {
                timeout?.close();
            }

            const fridaClearInterval = clearTimeout;

            function enroll(item, msecs) {
                globalThis.clearTimeout(item._idleTimeoutId);
                item._idleTimeoutId = null;
                item._idleTimeout = msecs;
            }

            function unenroll(item) {
                globalThis.clearTimeout(item._idleTimeoutId);
                item._idleTimeoutId = null;
                item._idleTimeout = -1;
            }

            function active(item) {
                globalThis.clearTimeout(item._idleTimeoutId);
                item._idleTimeoutId = null;

                const msecs = item._idleTimeout;
                if (msecs >= 0) {
                    item._idleTimeoutId = globalThis.setTimeout(() => {
                        item._onTimeout();
                    }, msecs);
                }
            }

            const _unrefActive = active;

            const fridaSetImmediate = globalThis.setImmediate;
            const fridaClearImmediate = globalThis.clearImmediate;

            export default {
                fridaSetTimeout,
                fridaSetInterval,
                fridaClearTimeout,
                fridaClearInterval,
                fridaSetImmediate,
                fridaClearImmediate,
                enroll,
                unenroll,
                active,
                _unrefActive,

            };
            `;
        const timersShimFile = yield* fileSystem.makeTempFileScoped();
        yield* fileSystem.writeFileString(timersShimFile, timersShim);

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
            esbuildOptions(options) {
                options.define = {
                    URL: "Url",
                };

                // Inject polyfills for Node.js built-in modules
                options.inject = [
                    processShimFile,
                    timersShimFile,
                    require.resolve("fast-text-encoding"),
                    // require.resolve("@frida/assert"),
                    // require.resolve("@frida/base64-js"),
                    // require.resolve("@frida/buffer"),
                    // require.resolve("@frida/crypto"),
                    // require.resolve("@frida/diagnostics_channel"),
                    // require.resolve("@frida/events"),
                    // require.resolve("frida-fs"),
                    // require.resolve("@frida/http"),
                    // require.resolve("@frida/http-parser-js"),
                    // require.resolve("@frida/https"),
                    // require.resolve("@frida/ieee754"),
                    // require.resolve("@frida/net"),
                    // require.resolve("@frida/os"),
                    // require.resolve("@frida/path"),
                    // require.resolve("@frida/process"),
                    // require.resolve("@frida/punycode"),
                    // require.resolve("@frida/querystring"),
                    // require.resolve("@frida/readable-stream"),
                    // require.resolve("@frida/stream"),
                    // require.resolve("@frida/string_decoder"),
                    // require.resolve("@frida/timers"),
                    // require.resolve("@frida/tty"),
                    require.resolve("@frida/url"),
                    // require.resolve("@frida/util"),
                    // require.resolve("@frida/vm"),
                ];

                // Configure external packages (these will be required at runtime)
                options.external = [];

                // Map Node.js and other modules to their @frida equivalents
                options.alias = {
                    "node:assert": require.resolve("@frida/assert"),
                    assert: require.resolve("@frida/assert"),
                    "base64-js": require.resolve("@frida/base64-js"),
                    "node:buffer": require.resolve("@frida/buffer"),
                    buffer: require.resolve("@frida/buffer"),
                    "node:crypto": require.resolve("@frida/crypto"),
                    crypto: require.resolve("@frida/crypto"),
                    "node:diagnostics_channel": require.resolve("@frida/diagnostics_channel"),
                    diagnostics_channel: require.resolve("@frida/diagnostics_channel"),
                    "node:events": require.resolve("@frida/events"),
                    events: require.resolve("@frida/events"),
                    "node:fs": require.resolve("frida-fs"),
                    fs: require.resolve("frida-fs"),
                    "node:http": require.resolve("@frida/http"),
                    http: require.resolve("@frida/http"),
                    // "http-parser-js": require.resolve("@frida/http-parser-js"),
                    "node:https": require.resolve("@frida/https"),
                    https: require.resolve("@frida/https"),
                    ieee754: require.resolve("@frida/ieee754"),
                    "node:net": require.resolve("@frida/net"),
                    net: require.resolve("@frida/net"),
                    "node:os": require.resolve("@frida/os"),
                    os: require.resolve("@frida/os"),
                    "node:path": require.resolve("@frida/path"),
                    path: require.resolve("@frida/path"),
                    "@frida/process": require.resolve("@frida/process"),
                    "node:process": require.resolve("@frida/process"),
                    process: require.resolve("@frida/process"),
                    punycode: require.resolve("@frida/punycode"),
                    "node:querystring": require.resolve("@frida/querystring"),
                    querystring: require.resolve("@frida/querystring"),
                    "node:readable-stream": require.resolve("@frida/readable-stream"),
                    "readable-stream": require.resolve("@frida/readable-stream"),
                    "node:stream": require.resolve("@frida/stream"),
                    stream: require.resolve("@frida/stream"),
                    string_decoder: require.resolve("@frida/string_decoder"),
                    "node:timers": require.resolve(timersShimFile),
                    timers: require.resolve(timersShimFile),
                    "node:tty": require.resolve("@frida/tty"),
                    tty: require.resolve("@frida/tty"),
                    "node:url": require.resolve("@frida/url"),
                    url: require.resolve("@frida/url"),
                    "node:util": require.resolve("@frida/util"),
                    util: require.resolve("@frida/util"),
                    "node:vm": require.resolve("@frida/vm"),
                    vm: require.resolve("@frida/vm"),
                };
            },
        }) as Tsup.Options;

        yield* Effect.promise(() => Tsup.build(config));
        return yield* fileSystem
            .readFileString(compiledAgentLocation)
            .pipe(
                Effect.map(
                    String.replace(
                        'var setImmediate = "setImmediate" in globalThis ? globalThis.setImmediate : (f) => setTimeout(f, 0);',
                        ""
                    )
                )
            )
            .pipe(Effect.map((source) => Terser.minify(source, { compress: true, mangle: true })))
            .pipe(Effect.map(({ code }) => Option.fromNullable(code)))
            .pipe(Effect.map(Option.getOrThrow));
    },
    Effect.scoped,
    Effect.orDie
);
