/**
 * A vitest pool that runs test files inside a frida agent.
 *
 * @since 1.0.0
 */

import type * as PlatformError from "effect/PlatformError";

import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as FileSystem from "effect/FileSystem";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";

import type * as FridaDeviceAcquisitionError from "@efffrida/frida-tools/FridaDeviceAcquisitionError";
import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";
import type * as VitestNode from "vitest/node";

import * as NodeChildProcessSpawner from "@effect/platform-node-shared/NodeChildProcessSpawner";
import * as NodeFileSystem from "@effect/platform-node-shared/NodeFileSystem";
import * as NodePath from "@effect/platform-node-shared/NodePath";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
import * as Flatted from "flatted";

/**
 * @since 1.0.0
 * @category Schemas
 */
export const FridaSchema: Schema.Struct<{
    readonly device: typeof FridaDevice.DeviceSchema;
    readonly attach: typeof FridaSession.AttachSchema;
}> = Schema.Struct({
    device: FridaDevice.DeviceSchema,
    attach: FridaSession.AttachSchema,
});

type InitError =
    | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
    | FridaSessionError.FridaSessionError
    | PlatformError.PlatformError
    | PlatformError.BadArgument;

/**
 * @since 1.0.0
 * @category Tests
 */
export class FridaPoolWorker implements VitestNode.PoolWorker {
    public readonly name = "frida-pool";
    private static initQueue: Promise<void> = Promise.resolve();

    private readonly runtime: ManagedRuntime.ManagedRuntime<FridaScript.FridaScript, InitError>;
    private readonly initPromise: Promise<Exit.Exit<void, InitError>>;

    private readonly listeners: Map<string, (...args: Array<unknown>) => void> = new Map();
    private cancelables: Array<(interrupter?: number) => void> = [];
    private sends: Array<Promise<unknown>> = [];

    constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof FridaSchema>) {
        const DeviceLive = FridaDevice.DeviceLive(customOptions.device);
        const SessionLive = FridaSession.SessionLive(customOptions.attach);
        const FridaLive = Layer.provide(SessionLive, DeviceLive);
        const NodeLive = Layer.provideMerge(
            NodeChildProcessSpawner.layer,
            Layer.merge(NodeFileSystem.layer, NodePath.layer)
        );

        const ScriptLive = Effect.gen(function* () {
            const path = yield* Path.Path;
            const fs = yield* FileSystem.FileSystem;

            // The agent must live inside the project so that frida's compiler
            // can resolve node_modules, but not under node_modules since
            // frida's compiler won't emit it
            const tempDir = yield* fs.makeTempDirectoryScoped({
                directory: poolOptions.project.config.root,
                prefix: ".vitest-frida-pool-",
            });
            const tempFile = path.join(tempDir, "agent.ts");

            const agentUrl = yield* path.fromFileUrl(new URL("../frida/agent.ts", import.meta.url));
            const baseAgent = yield* fs.readFileString(agentUrl);

            const setupFiles = poolOptions.project.config.setupFiles;
            const testFiles = yield* Effect.map(
                Effect.promise(() => poolOptions.project.globTestFiles()),
                ({ testFiles }) => testFiles
            );

            // globalSetup files run in the main node process, not the agent
            const marker = "// @efffrida/vitest-pool/agent/file-map";
            const allFiles = Array.appendAll(setupFiles, testFiles);
            const newContent = Function.pipe(
                allFiles,
                Array.map(
                    (file) => `
                        if (_file === ${JSON.stringify(file)}) {
                            // @ts-ignore
                            return await import(${JSON.stringify(file)})
                        }`
                ),
                Array.join("\n")
            );

            yield* fs.writeFileString(tempFile, baseAgent.replace(marker, newContent));
            const { runtime, platform } = customOptions.attach;
            return FridaScript.layer(tempFile, {
                ...(runtime !== undefined ? { runtime } : {}),
                ...(platform !== undefined ? { platform } : {}),
            });
        }).pipe(Layer.unwrap, Layer.provide(FridaLive), Layer.provide(NodeLive));

        // The runtime builds its layer lazily, so force the build here to
        // serialize it with the initialization of the other workers
        this.runtime = ManagedRuntime.make(ScriptLive);
        const prev = FridaPoolWorker.initQueue;
        const runInit = () => Effect.runPromiseExit(Effect.asVoid(this.runtime.contextEffect));
        this.initPromise = prev.then(runInit, runInit);
        FridaPoolWorker.initQueue = this.initPromise.then(
            () => undefined,
            () => undefined
        );
    }

    // @effect-diagnostics-next-line asyncFunction:off
    async start(): Promise<void> {
        const exit = await this.initPromise;
        if (Exit.isFailure(exit)) throw Cause.prettyErrors(exit.cause)[0];
    }

    // @effect-diagnostics-next-line asyncFunction:off
    async stop(): Promise<void> {
        await Promise.allSettled(this.sends);
        for (const cancelable of this.cancelables) cancelable();
        await this.runtime.dispose();
        this.cancelables = [];
    }

    send(message: VitestNode.WorkerRequest): void {
        // Not a const since finally may read it before the assignment when the
        // body throws synchronously
        let sendPromise: Promise<void> | undefined;

        // @effect-diagnostics-next-line asyncFunction:off
        sendPromise = (async () => {
            try {
                const exit = await Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                    fridaScript.callExport("onMessage")(message)
                ).pipe(this.runtime.runPromiseExit);
                if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause)) {
                    this.emitError(Cause.prettyErrors(exit.cause)[0]);
                }
            } catch (error) {
                this.emitError(error);
            } finally {
                this.sends = this.sends.filter((p) => p !== sendPromise);
            }
        })();

        this.sends.push(sendPromise);
    }

    private emitError(error: unknown): void {
        const listener = this.listeners.get("error");
        if (listener) listener(error);
    }

    on(event: string, callback: (arg: any) => void): void {
        let makeCancellable: () => (interrupter?: number | undefined) => void = undefined!;

        switch (event) {
            case "message": {
                makeCancellable = () =>
                    this.runtime.runCallback(
                        Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                            Stream.runForEach(fridaScript.stream, (input) =>
                                Effect.sync(() => {
                                    const listener = this.listeners.get(event);
                                    if (listener) listener(input.message);
                                })
                            )
                        )
                    );

                break;
            }

            case "error":
                makeCancellable = () =>
                    this.runtime.runCallback(
                        Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                            Deferred.await(fridaScript.scriptError)
                        ),
                        {
                            onExit: (exit) => {
                                const listener = this.listeners.get(event);
                                if (!listener) return;

                                if (Exit.isSuccess(exit)) {
                                    listener(exit.value);
                                } else if (!Cause.hasInterruptsOnly(exit.cause)) {
                                    listener(exit.cause);
                                }
                            },
                        }
                    );

                break;

            case "exit":
                makeCancellable = () =>
                    this.runtime.runCallback(
                        Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Deferred.await(fridaScript.destroyed)),
                        {
                            onExit: () => {
                                const listener = this.listeners.get(event);
                                if (listener) listener(void 0);
                            },
                        }
                    );

                break;

            default:
                throw new Error(`Event ${event} not supported in FridaPoolWorker`);
        }

        const cancelable = makeCancellable();
        this.listeners.set(event, callback);
        this.cancelables.push(cancelable);
    }

    off(event: string, _callback: (arg: any) => void): void {
        this.listeners.delete(event);
    }

    deserialize(data: unknown) {
        if (typeof data !== "string") return data;
        else return Flatted.parse(data);
    }
}

/**
 * @since 1.0.0
 * @category Tests
 */
export const createFridaPool = (
    customOptions: Schema.Codec.Encoded<typeof FridaSchema>
): VitestNode.PoolRunnerInitializer => {
    return {
        name: "frida-pool",
        createPoolWorker: (options: VitestNode.PoolOptions) =>
            new FridaPoolWorker(options, Schema.decodeSync(FridaSchema)(customOptions)),
    };
};
