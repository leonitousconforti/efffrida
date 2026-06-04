import type * as Context from "effect/Context";
import type * as PlatformError from "effect/PlatformError";

import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as FileSystem from "effect/FileSystem";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";

import type * as FridaDeviceAcquisitionError from "@efffrida/frida-tools/FridaDeviceAcquisitionError";
import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";
import type * as VitestNode from "vitest/node";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
import * as Flatted from "flatted";

/**
 * @since 1.0.0
 * @category Schemas
 */
export const FridaSchema = Schema.Struct({
    device: FridaDevice.DeviceSchema,
    attach: FridaSession.AttachSchema,
});

/**
 * @since 1.0.0
 * @category Tests
 */
export class FridaPoolWorker implements VitestNode.PoolWorker {
    public readonly name = "frida-pool";
    private static initQueue: Promise<void> = Promise.resolve();

    private readonly scope: Scope.Closeable;
    private scriptContext: Context.Context<FridaScript.FridaScript> = undefined!;
    private readonly scriptContextPromise: Promise<
        Exit.Exit<
            Context.Context<FridaScript.FridaScript>,
            | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
            | FridaSessionError.FridaSessionError
            | PlatformError.PlatformError
            | PlatformError.BadArgument
        >
    >;

    private readonly cancelables: Map<(arg: any) => void, (interrupter?: number) => void> = new Map();
    private sends: Array<Promise<unknown>> = [];

    constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof FridaSchema>) {
        const DeviceLive = FridaDevice.DeviceLive(customOptions.device);
        const SessionLive = FridaSession.SessionLive(customOptions.attach);
        const FridaLive = Layer.provide(SessionLive, DeviceLive);

        const ScriptLive = Effect.gen(function* () {
            const path = yield* Path.Path;
            const fs = yield* FileSystem.FileSystem;

            const tempDir = path.join(poolOptions.project.config.root, "temp");
            yield* fs.makeDirectory(tempDir, { recursive: true });

            const agentUrl = yield* path.fromFileUrl(new URL("../frida/agent.ts", import.meta.url));
            const baseAgent = yield* fs.readFileString(agentUrl);
            const tempFile = yield* fs.makeTempFileScoped({
                directory: tempDir,
                prefix: ".vitest-frida-pool-agent-",
                suffix: ".ts",
            });

            const setupFiles = poolOptions.project.config.setupFiles;
            const testFiles = yield* Effect.map(
                Effect.promise(() => poolOptions.project.globTestFiles()),
                ({ testFiles }) => testFiles
            );
            const globalSetupFiles = Array.isArray(poolOptions.project.config.globalSetup)
                ? poolOptions.project.config.globalSetup
                : Array.make(poolOptions.project.config.globalSetup);

            const marker = "// @efffrida/vitest-pool/agent/file-map";
            const allFiles = Array.flatten([setupFiles, testFiles, globalSetupFiles]);
            const newContent = Function.pipe(
                allFiles,
                Array.map(
                    (file) => `
                        if (_file === "${file}") {
                            // @ts-ignore
                            return await import("${file}")
                        }`
                ),
                Array.join("\n")
            );

            yield* fs.writeFileString(tempFile, baseAgent.replace(marker, newContent));
            return FridaScript.layer(tempFile);
        }).pipe(Layer.unwrap, Layer.provide(FridaLive), Layer.provide(NodeServices.layer));

        this.scope = Scope.makeUnsafe();
        const prev = FridaPoolWorker.initQueue;
        const runInit = () => ScriptLive.pipe(Layer.buildWithScope(this.scope), Effect.runPromiseExit);
        this.scriptContextPromise = prev.then(runInit, runInit);
        FridaPoolWorker.initQueue = this.scriptContextPromise.then(
            () => undefined,
            () => undefined
        );
    }

    async start(): Promise<void> {
        const exit = await this.scriptContextPromise;
        if (Exit.isSuccess(exit)) this.scriptContext = exit.value;
        else throw Cause.prettyErrors(exit.cause)[0];
    }

    async stop(): Promise<void> {
        await Promise.allSettled(this.sends);
        for (const cancelable of this.cancelables.values()) cancelable();
        await Scope.close(this.scope, Exit.void).pipe(Effect.runPromise);
        this.cancelables.clear();
    }

    async send(message: VitestNode.WorkerRequest): Promise<void> {
        let sendPromise: Promise<unknown> = undefined!;

        try {
            sendPromise = Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                fridaScript.callExport("onMessage")(message)
            ).pipe(Effect.runPromiseWith(this.scriptContext));
            this.sends.push(sendPromise);
            await sendPromise;
        } finally {
            this.sends = this.sends.filter((p) => p !== sendPromise);
        }
    }

    on(event: string, callback: (arg: any) => void): void {
        switch (event) {
            case "message": {
                this.cancelables.set(
                    callback,
                    Effect.runCallbackWith(this.scriptContext)(
                        Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                            Stream.runForEach(fridaScript.stream, (input) => Effect.sync(() => callback(input.message)))
                        )
                    )
                );

                break;
            }

            case "error":
                this.cancelables.set(
                    callback,
                    Effect.runCallbackWith(this.scriptContext)(
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

                break;

            case "exit":
                this.cancelables.set(
                    callback,
                    Effect.runCallbackWith(this.scriptContext)(
                        Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Deferred.await(fridaScript.destroyed)),
                        { onExit: () => callback(void 0) }
                    )
                );

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
            new FridaPoolWorker(options, Schema.decodeUnknownSync(FridaSchema)(customOptions)),
    };
};
