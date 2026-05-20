import type * as Context from "effect/Context";

import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Match from "effect/Match";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import * as ChildProcess from "effect/unstable/process/ChildProcess";

import type * as VitestNode from "vitest/node";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
import * as Esbuild from "esbuild";
import * as Flatted from "flatted";
import * as Frida from "frida";

// First, pick your device
const DeviceSchema = Schema.Union([
    Schema.Struct({
        connection: Schema.Literal("local"),
    }),
    Schema.Struct({
        connection: Schema.Literal("usb"),
        timeout: Schema.optional(Schema.DurationFromMillis),
    }),
    Schema.Struct({
        address: Schema.String,
        connection: Schema.Literal("remote"),
        token: Schema.optional(Schema.String),
        origin: Schema.optional(Schema.String),
        keepaliveInterval: Schema.optional(Schema.DurationFromMillis),
    }),
    Schema.Struct({
        emulatorName: Schema.String,
        hidden: Schema.optional(Schema.Boolean),
        adbExecutable: Schema.optional(Schema.String),
        connection: Schema.Literal("android-emulator"),
        fridaExecutable: Schema.optional(Schema.String),
        emulatorExecutable: Schema.optional(Schema.String),
    }),
]);

// Second, pick your session
const AttachSchema = Schema.Union([
    Schema.Struct({
        pid: Schema.Number,
    }),
    Schema.Struct({
        spawn: Schema.NonEmptyArray(Schema.String),
        preSpawn: Schema.optional(Schema.Boolean),
    }),
    Schema.Struct({
        attachFrontmost: Schema.Literal(true),
        frontmostScope: Schema.optional(Schema.Literals(["minimal", "metadata", "full"])),
    }),
]);

// Third, pick your runtime and platform
const ConfigSchema = Schema.Struct({
    device: DeviceSchema,
    attach: AttachSchema,
    runtime: Schema.optional(Schema.Literals(["default", "qjs", "v8"])),
    platform: Schema.optional(Schema.Literals(["gum", "browser", "neutral"])),
});

/**
 * @since 1.0.0
 * @category Tests
 */
export class FridaPoolWorker implements VitestNode.PoolWorker {
    public readonly name = "frida-pool";

    private readonly scope: Scope.Closeable;
    private readonly scriptContext: Promise<Context.Context<FridaScript.FridaScript>>;
    private readonly cancelables: Map<(arg: any) => void, (interrupter?: number) => void> = new Map();

    private sends: Array<Promise<unknown>> = [];

    constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof ConfigSchema>) {
        const FridaRuntime = Match.value(customOptions.runtime).pipe(
            Match.when(undefined, () => undefined),
            Match.when("v8", () => Frida.ScriptRuntime.V8),
            Match.when("qjs", () => Frida.ScriptRuntime.QJS),
            Match.when("default", () => Frida.ScriptRuntime.Default),
            Match.exhaustive
        );

        const FridaPlatform = Match.value(customOptions.platform).pipe(
            Match.when(undefined, () => undefined),
            Match.when("gum", () => Frida.JsPlatform.Gum),
            Match.when("browser", () => Frida.JsPlatform.Browser),
            Match.when("neutral", () => Frida.JsPlatform.Neutral),
            Match.exhaustive
        );

        const DeviceLive = Match.value(customOptions.device).pipe(
            Match.when({ connection: "local" }, () => FridaDevice.layerLocalDevice),
            Match.when({ connection: "usb" }, ({ timeout }) =>
                FridaDevice.layerUsbDevice({
                    timeout: timeout ? Duration.toMillis(timeout) : undefined,
                } as Frida.GetDeviceOptions)
            ),
            Match.when({ connection: "remote" }, ({ address, keepaliveInterval, origin, token }) =>
                FridaDevice.layerRemoteDevice(address, {
                    keepaliveInterval: keepaliveInterval ? Duration.toSeconds(keepaliveInterval) : undefined,
                    token,
                    origin,
                } as Frida.RemoteDeviceOptions)
            ),
            Match.when(
                { connection: "android-emulator" },
                ({ adbExecutable, emulatorExecutable, emulatorName, fridaExecutable, hidden }) =>
                    FridaDevice.layerAndroidEmulatorDevice(emulatorName, {
                        hidden: hidden ?? undefined,
                        adbExecutable: adbExecutable ?? undefined,
                        fridaExecutable: fridaExecutable ?? undefined,
                        emulatorExecutable: emulatorExecutable ?? undefined,
                    })
            ),
            Match.exhaustive
        );

        const SessionLive = Match.value(customOptions.attach).pipe(
            Match.when({ pid: Match.number }, ({ pid }) => FridaSession.layer(pid)),
            Match.when({ attachFrontmost: true }, ({ frontmostScope }) =>
                FridaSession.layerFrontmost({ scope: frontmostScope } as Frida.FrontmostQueryOptions)
            ),
            Match.when({ preSpawn: true }, ({ spawn }) =>
                Layer.unwrap(
                    Effect.gen(function* () {
                        const [command, ...args] = spawn;
                        const handle = yield* ChildProcess.make(command, args);
                        return FridaSession.layer(handle.pid);
                    })
                )
            ),
            Match.orElse(({ spawn }) => FridaSession.layer(spawn))
        );

        const FridaLive = Layer.provide(SessionLive, DeviceLive);
        const ScriptLive = Effect.map(
            compileTestFiles(new URL("../frida/agent.ts", import.meta.url), poolOptions, customOptions),
            (agentUrl) =>
                FridaScript.layer(agentUrl, {
                    ...(FridaRuntime !== undefined ? { runtime: FridaRuntime } : {}),
                    ...(FridaPlatform !== undefined ? { platform: FridaPlatform } : {}),
                })
        ).pipe(
            Layer.unwrap,
            Layer.fresh,
            Layer.provide(FridaLive),
            Layer.provide(NodeServices.layer),
            Layer.satisfiesSuccessType<FridaScript.FridaScript>()
        );

        this.scope = Scope.makeUnsafe();
        this.scriptContext = ScriptLive.pipe(Layer.buildWithScope(this.scope), Effect.runPromise);
    }

    async start(): Promise<void> {
        await this.scriptContext;
    }

    async stop(): Promise<void> {
        await Promise.allSettled(this.sends);
        for (const cancelable of this.cancelables.values()) cancelable();
        await Scope.close(this.scope, Exit.void).pipe(Effect.runPromise);
        this.cancelables.clear();
    }

    async send(message: VitestNode.WorkerRequest): Promise<void> {
        const context = await this.scriptContext;
        let sendPromise: Promise<unknown> = undefined!;

        try {
            sendPromise = Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                fridaScript.callExport("onMessage")(message)
            ).pipe(Effect.runPromiseWith(context));
            this.sends.push(sendPromise);
            await sendPromise;
        } finally {
            this.sends = this.sends.filter((p) => p !== sendPromise);
        }
    }

    on(event: string, callback: (arg: any) => void): void {
        switch (event) {
            case "message": {
                this.scriptContext.then((ctx) => {
                    this.cancelables.set(
                        callback,
                        Effect.runCallbackWith(ctx)(
                            Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                                Stream.runForEach(fridaScript.stream, (input) =>
                                    Effect.sync(() => callback(input.message))
                                )
                            )
                        )
                    );
                });

                break;
            }

            case "error":
                this.scriptContext.then((ctx) => {
                    this.cancelables.set(
                        callback,
                        Effect.runCallbackWith(ctx)(
                            Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                                Deferred.await(fridaScript.scriptError)
                            ),
                            {
                                onExit: (exit) => {
                                    if (Exit.isSuccess(exit)) {
                                        callback(exit.value);
                                    } else if (!Cause.hasInterruptsOnly(exit.cause)) {
                                        callback(exit.cause);
                                    }
                                },
                            }
                        )
                    );
                });

                break;

            case "exit":
                this.scriptContext.then((ctx) => {
                    this.cancelables.set(
                        callback,
                        Effect.runCallbackWith(ctx)(
                            Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                                Deferred.await(fridaScript.destroyed)
                            ),
                            { onExit: () => callback(void 0) }
                        )
                    );
                });

                break;

            default:
                throw new Error(`Event ${event} not supported in FridaPoolWorker`);
        }
    }

    off(_event: string, callback: (arg: any) => void): void {
        const cancelable = this.cancelables.get(callback);
        if (cancelable !== undefined) {
            this.cancelables.delete(callback);
            cancelable();
        }
    }

    deserialize(data: unknown) {
        if (typeof data !== "string") return data;
        else return Flatted.parse(data);
    }

    serialize(data: unknown) {
        return data;
    }

    canReuse() {
        return true;
    }
}

/**
 * @since 1.0.0
 * @category Tests
 */
export const createFridaPool = (
    customOptions: Schema.Codec.Encoded<typeof ConfigSchema>
): VitestNode.PoolRunnerInitializer => {
    const decoded = Schema.decodeUnknownSync(ConfigSchema)(customOptions);
    return {
        name: "frida-pool",
        createPoolWorker: (options: VitestNode.PoolOptions) => new FridaPoolWorker(options, decoded),
    };
};

/** @internal */
const vitestGlobalsPlugin: Esbuild.Plugin = {
    name: "vitest-globals",
    setup(build) {
        // Handle vitest and @vitest/* imports
        build.onResolve({ filter: /^(vitest|@vitest\/.*)$/ }, (args) => ({
            path: args.path,
            namespace: "vitest-globals",
        }));

        build.onLoad({ filter: /.*/, namespace: "vitest-globals" }, (args) => {
            if (args.path === "vitest") {
                return {
                    loader: "js",
                    contents: "export * from 'VITEST_GLOBAL';\nexport { default } from 'VITEST_GLOBAL';",
                };
            }
            if (args.path === "@vitest/runner") {
                return {
                    loader: "js",
                    contents: "export * from 'VITEST_RUNNER_GLOBAL';\nexport { default } from 'VITEST_RUNNER_GLOBAL';",
                };
            }
            return {
                loader: "js",
                contents: "export * from 'VITEST_GLOBAL';\nexport { default } from 'VITEST_GLOBAL';",
            };
        });

        build.onResolve({ filter: /^VITEST_(GLOBAL|RUNNER_GLOBAL)$/ }, (args) => ({
            path: args.path,
            namespace: "vitest-synthetic",
        }));

        build.onLoad({ filter: /.*/, namespace: "vitest-synthetic" }, (args) => {
            const globalName = args.path === "VITEST_GLOBAL" ? "__vitest" : "__vitest_runner";
            return {
                loader: "js",
                contents: `
                    const g = globalThis.${globalName};
                    export default g;
                    export const {
                        describe, it, test, expect, vi, beforeAll, afterAll,
                        beforeEach, afterEach, suite, bench, assert
                    } = g;
                `,
            };
        });

        // Handle Node.js built-in modules - redirect to globals set up by the agent
        // The agent imports these from frida-compile's shims and exposes them as globals
        const nodeModuleMap: Record<string, string> = {
            "node:assert": "__node_assert",
            "node:buffer": "__node_buffer",
            "node:crypto": "__node_crypto",
            "node:diagnostics_channel": "__node_diagnosticsChannel",
            "node:events": "__node_events",
            "node:fs": "__node_fs",
            "node:net": "__node_net",
            "node:os": "__node_os",
            "node:path": "__node_path",
            "node:process": "__node_process",
            "node:stream": "__node_stream",
            "node:timers": "__node_timers",
            "node:tty": "__node_tty",
            "node:url": "__node_url",
            "node:util": "__node_util",
            "node:vm": "__node_vm",
            assert: "__node_assert",
            buffer: "__node_buffer",
            crypto: "__node_crypto",
            diagnostics_channel: "__node_diagnosticsChannel",
            events: "__node_events",
            fs: "__node_fs",
            net: "__node_net",
            os: "__node_os",
            path: "__node_path",
            process: "__node_process",
            stream: "__node_stream",
            timers: "__node_timers",
            tty: "__node_tty",
            url: "__node_url",
            util: "__node_util",
            vm: "__node_vm",
        };

        build.onResolve(
            {
                filter: /^(node:)?(assert|buffer|crypto|diagnostics_channel|events|fs|net|os|path|process|stream|timers|tty|url|util|vm)$/,
            },
            (args) => ({
                path: args.path,
                namespace: "node-globals",
            })
        );

        build.onLoad({ filter: /.*/, namespace: "node-globals" }, (args) => {
            const globalName = nodeModuleMap[args.path];
            if (!globalName) {
                return { loader: "js", contents: "export default {};" };
            }
            return {
                loader: "js",
                contents: `
                    const m = globalThis.${globalName};
                    export default m;
                    export const { Buffer } = m.Buffer ? m : { Buffer: m.default?.Buffer };
                    export * from 'NODE_MODULE_REEXPORT_${globalName}';
                `,
            };
        });

        // Handle re-exports from node modules
        build.onResolve({ filter: /^NODE_MODULE_REEXPORT_/ }, (args) => ({
            path: args.path,
            namespace: "node-reexport",
        }));

        build.onLoad({ filter: /.*/, namespace: "node-reexport" }, (args) => {
            const globalName = args.path.replace("NODE_MODULE_REEXPORT_", "");
            return {
                loader: "js",
                contents: `
                    const m = globalThis.${globalName};
                    const mod = m.default || m;
                    for (const key in mod) {
                        if (key !== 'default') {
                            Object.defineProperty(exports, key, {
                                enumerable: true,
                                get: () => mod[key]
                            });
                        }
                    }
                `,
            };
        });
    },
};

/** @internal */
const compileTestFiles = Effect.fnUntraced(function* (
    agentTemplatePath: URL,
    poolOptions: VitestNode.PoolOptions,
    customOptions: Schema.Schema.Type<typeof ConfigSchema>
) {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    const url = yield* path.fromFileUrl(agentTemplatePath);

    const testFilesList: Array<string> = (poolOptions.project as any).testFilesList ?? [];
    const setupFiles: Array<string> = poolOptions.project.config.setupFiles ?? [];
    const allFiles = [...new Set([...setupFiles, ...testFilesList])];
    const testFilesMap: Record<string, string> = {};

    const esbuildPlatform = Match.value(customOptions.platform).pipe(
        Match.when("browser", () => "browser" as const),
        Match.when("neutral", () => "neutral" as const),
        Match.whenOr("gum", undefined, () => "node" as const),
        Match.orElseAbsurd
    );

    for (const testFile of allFiles) {
        const result = yield* Effect.promise(() =>
            Esbuild.build({
                bundle: true,
                write: false,
                format: "esm",
                platform: esbuildPlatform,
                target: "es2020",
                entryPoints: [testFile],
                plugins: [vitestGlobalsPlugin],
            })
        );

        if (!result.outputFiles || result.outputFiles.length === 0) {
            return yield* Effect.die(new Error(`esbuild produced no output for ${testFile}`));
        } else {
            testFilesMap[testFile] = Buffer.from(result.outputFiles[0].text).toString("base64");
        }
    }

    const agentTemplateContents = yield* fs.readFileString(url);
    const modifiedAgentContents = agentTemplateContents.replace(
        /^const testFiles: Record<string, string> = \{\};$/m,
        `const testFiles: Record<string, string> = ${JSON.stringify(testFilesMap, null, 4)};`
    );

    const tempAgentPath = yield* fs.makeTempFileScoped({
        suffix: ".ts",
        prefix: ".agent-",
        directory: path.dirname(url),
    });

    yield* fs.writeFileString(tempAgentPath, modifiedAgentContents);
    return yield* path.toFileUrl(tempAgentPath);
});
