import type * as PlatformError from "@effect/platform/Error";
import type * as FridaDeviceAcquisitionError from "@efffrida/frida-tools/FridaDeviceAcquisitionError";
import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";
import type * as Option from "effect/Option";
import type * as ParseResult from "effect/ParseResult";
import type * as Runtime from "effect/Runtime";
import type * as VitestNode from "vitest/node";

import * as NodeContext from "@effect/platform-node/NodeContext";
import * as Command from "@effect/platform/Command";
import * as CommandExecutor from "@effect/platform/CommandExecutor";
import * as FileSystem from "@effect/platform/FileSystem";
import * as Path from "@effect/platform/Path";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Match from "effect/Match";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as Esbuild from "esbuild";
import * as Flatted from "flatted";
import * as Frida from "frida";

// First, pick your device
class DeviceSchema extends Schema.Union(
    Schema.Struct({
        device: Schema.Literal("local"),
    }),
    Schema.Struct({
        device: Schema.Literal("usb"),
        timeout: Schema.optionalWith(Schema.DurationFromMillis, { nullable: true }),
    }),
    Schema.Struct({
        address: Schema.String,
        device: Schema.Literal("remote"),
        token: Schema.optionalWith(Schema.String, { nullable: true }),
        origin: Schema.optionalWith(Schema.String, { nullable: true }),
        keepaliveInterval: Schema.optionalWith(Schema.DurationFromMillis, { nullable: true }),
    }),
    Schema.Struct({
        emulatorName: Schema.String,
        device: Schema.Literal("android-emulator"),
        hidden: Schema.optionalWith(Schema.Boolean, { nullable: true }),
        adbExecutable: Schema.optionalWith(Schema.String, { nullable: true }),
        fridaExecutable: Schema.optionalWith(Schema.String, { nullable: true }),
        emulatorExecutable: Schema.optionalWith(Schema.String, { nullable: true }),
    })
) {}

// Second, pick your session
class AttachSchema extends Schema.Union(
    Schema.Struct({
        attach: Schema.Number.pipe(Schema.brand("pid")),
    }),
    Schema.Struct({
        spawn: Schema.NonEmptyArrayEnsure(Schema.String),
        preSpawn: Schema.optionalWith(Schema.Boolean, { nullable: true }),
    }),
    Schema.Struct({
        attachFrontmost: Schema.Literal(true),
        frontmostScope: Schema.optionalWith(Schema.Literal("minimal", "metadata", "full"), { nullable: true }),
    })
) {}

// Third, pick your runtime and platform
class ConfigSchema extends Schema.Struct({
    runtime: Schema.optionalWith(Schema.Literal("default", "qjs", "v8"), { nullable: true }),
    platform: Schema.optionalWith(Schema.Literal("gum", "browser", "neutral"), { nullable: true }),
})
    .pipe(Schema.extend(DeviceSchema))
    .pipe(Schema.extend(AttachSchema)) {}

/**
 * @since 1.0.0
 * @category Tests
 */
export class FridaPoolWorker implements VitestNode.PoolWorker {
    readonly name = "frida-pool";
    readonly agentTemplatePath = new URL("../frida/agent.ts", import.meta.url);

    private readonly poolOptions: VitestNode.PoolOptions;
    private readonly customOptions: Schema.Schema.Type<ConfigSchema>;

    private readonly cancelables: Map<
        (arg: any) => void,
        Runtime.Cancel<
            unknown,
            | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
            | PlatformError.PlatformError
            | FridaSessionError.FridaSessionError
        >
    >;

    private modifiedAgentScope: Scope.CloseableScope;
    private managedRuntime:
        | ManagedRuntime.ManagedRuntime<
              FridaScript.FridaScript,
              | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
              | PlatformError.PlatformError
              | FridaSessionError.FridaSessionError
          >
        | undefined;
    private sends: Array<
        Promise<
            Exit.Exit<
                void,
                | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
                | PlatformError.PlatformError
                | FridaSessionError.FridaSessionError
                | ParseResult.ParseError
            >
        >
    > = [];

    constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<ConfigSchema>) {
        this.poolOptions = poolOptions;
        this.customOptions = customOptions;
        this.cancelables = new Map();
        this.managedRuntime = undefined;
        this.modifiedAgentScope = Effect.runSync(Scope.make());
    }

    async start(): Promise<void> {
        const tempAgentUrl = await compileTestFiles(this.agentTemplatePath, this.poolOptions)
            .pipe(Scope.extend(this.modifiedAgentScope))
            .pipe(Effect.provide(NodeContext.layer))
            .pipe(Effect.runPromise);

        const FridaRuntime = Match.value(this.customOptions.runtime).pipe(
            Match.when(undefined, () => undefined),
            Match.when("v8", () => Frida.ScriptRuntime.V8),
            Match.when("qjs", () => Frida.ScriptRuntime.QJS),
            Match.when("default", () => Frida.ScriptRuntime.Default),
            Match.exhaustive
        );

        const FridaPlatform = Match.value(this.customOptions.platform).pipe(
            Match.when(undefined, () => undefined),
            Match.when("gum", () => Frida.JsPlatform.Gum),
            Match.when("browser", () => Frida.JsPlatform.Browser),
            Match.when("neutral", () => Frida.JsPlatform.Neutral),
            Match.exhaustive
        );

        const DeviceLive = Match.value(this.customOptions).pipe(
            Match.when({ device: "local" }, () => FridaDevice.layerLocalDevice),
            Match.when({ device: "usb" }, ({ timeout }) =>
                FridaDevice.layerUsbDevice({
                    timeout: timeout ? Duration.toMillis(timeout) : undefined,
                } as Frida.GetDeviceOptions)
            ),
            Match.when({ device: "remote" }, ({ address, keepaliveInterval, origin, token }) =>
                FridaDevice.layerRemoteDevice(address, {
                    token,
                    origin,
                    keepaliveInterval: keepaliveInterval ? Duration.toSeconds(keepaliveInterval) : undefined,
                } as Frida.RemoteDeviceOptions)
            ),
            Match.when(
                { device: "android-emulator" },
                ({ adbExecutable, emulatorExecutable, emulatorName, fridaExecutable, hidden }) =>
                    FridaDevice.layerAndroidEmulatorDevice(emulatorName, {
                        hidden,
                        adbExecutable,
                        fridaExecutable,
                        emulatorExecutable,
                    })
            ),
            Match.exhaustive
        );

        const SessionLive = Match.value(this.customOptions).pipe(
            Match.when({ attach: Match.number }, ({ attach }) => FridaSession.layer(attach)),
            Match.when({ attachFrontmost: true }, ({ frontmostScope }) =>
                FridaSession.layerFrontmost({ scope: frontmostScope } as Frida.FrontmostQueryOptions)
            ),
            Match.when({ preSpawn: true }, ({ spawn }) =>
                Layer.unwrapScoped(
                    Effect.gen(function* () {
                        const executor = yield* CommandExecutor.CommandExecutor;
                        const command = Command.make(...spawn);
                        const process = yield* executor.start(command);
                        return FridaSession.layer(process.pid);
                    })
                )
            ),
            Match.orElse(({ spawn }) => FridaSession.layer(spawn))
        );

        const FridaLive = Layer.provide(SessionLive, DeviceLive).pipe(Layer.provide(NodeContext.layer));
        const ScriptLive = FridaScript.layer(tempAgentUrl, {
            externals: ["jsdom", "happy-dom", "@edge-runtime/vm"],
            ...(FridaRuntime !== undefined ? { runtime: FridaRuntime } : {}),
            ...(FridaPlatform !== undefined ? { platform: FridaPlatform } : {}),
        }).pipe(Layer.provide(FridaLive));

        this.managedRuntime = ManagedRuntime.make(ScriptLive);

        const exit = await this.managedRuntime.runPromiseExit(Effect.void);
        if (Exit.isSuccess(exit)) return;
        const prettyError = Cause.prettyErrors(exit.cause);
        throw prettyError[0];
    }

    async stop(): Promise<void> {
        await Promise.allSettled(this.sends);
        await this.managedRuntime!.dispose();
        await Effect.runPromise(Scope.close(this.modifiedAgentScope, Exit.void));
    }

    async send(message: VitestNode.WorkerRequest): Promise<void> {
        const sendPromise = this.managedRuntime!.runPromiseExit(
            Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                fridaScript.callExport("onMessage", Schema.Void)(message)
            )
        );

        this.sends.push(sendPromise);
        const exit = await sendPromise;
        this.sends = this.sends.filter((p) => p !== sendPromise);
        if (Exit.isSuccess(exit)) return;
        const prettyError = Cause.prettyErrors(exit.cause);
        throw prettyError[0];
    }

    on(event: string, callback: (arg: any) => void): void {
        let cancelable!: Runtime.Cancel<
            unknown,
            | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
            | PlatformError.PlatformError
            | FridaSessionError.FridaSessionError
        >;

        const sink = Sink.forEach<
            {
                message: unknown;
                data: Option.Option<Buffer<ArrayBufferLike>>;
            },
            void,
            never,
            never
        >((input) =>
            Effect.sync(() => {
                callback(input.message);
            })
        );

        switch (event) {
            case "message":
                cancelable = this.managedRuntime!.runCallback(
                    Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Stream.run(fridaScript.stream, sink))
                );
                break;

            case "error":
                cancelable = this.managedRuntime!.runCallback(
                    Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Deferred.await(fridaScript.scriptError)),
                    { onExit: (exit) => (Exit.isSuccess(exit) ? callback(exit.value) : callback(exit.cause)) }
                );
                break;

            case "exit":
                cancelable = this.managedRuntime!.runCallback(
                    Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Deferred.await(fridaScript.destroyed)),
                    { onExit: () => callback(void 0) }
                );
                break;

            default:
                throw new Error(`Event ${event} not supported in FridaPoolWorker`);
        }

        this.cancelables.set(callback, cancelable);
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
}

/**
 * @since 1.0.0
 * @category Tests
 */
export const createFridaPool = (
    customOptions: Schema.Schema.Encoded<ConfigSchema>
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
    customOptions?: Schema.Schema.Type<ConfigSchema> | undefined
): Effect.fn.Return<URL, PlatformError.PlatformError, Path.Path | FileSystem.FileSystem | Scope.Scope> {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    const url = yield* path.fromFileUrl(agentTemplatePath);

    const testFiles = poolOptions.project.testFilesList ?? [];
    const testFilesMap: Record<string, string> = {};

    const esbuildPlatform = Match.value(customOptions?.platform).pipe(
        Match.when("browser", () => "browser" as const),
        Match.when("neutral", () => "neutral" as const),
        Match.whenOr("gum", undefined, () => "node" as const),
        Match.orElseAbsurd
    );

    for (const testFile of testFiles) {
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
            return yield* Effect.dieMessage(`esbuild produced no output for ${testFile}`);
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
