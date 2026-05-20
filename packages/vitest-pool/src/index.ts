import type * as Context from "effect/Context";

import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Match from "effect/Match";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import * as ChildProcess from "effect/unstable/process/ChildProcess";

import type * as VitestNode from "vitest/node";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as FridaDevice from "@efffrida/frida-tools/FridaDevice";
import * as FridaScript from "@efffrida/frida-tools/FridaScript";
import * as FridaSession from "@efffrida/frida-tools/FridaSession";
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

    constructor(_poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof ConfigSchema>) {
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
        const ScriptLive = FridaScript.layer(new URL("../frida/agent.ts", import.meta.url), {
            ...(FridaRuntime !== undefined ? { runtime: FridaRuntime } : {}),
            ...(FridaPlatform !== undefined ? { platform: FridaPlatform } : {}),
        }).pipe(
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
}

/**
 * @since 1.0.0
 * @category Tests
 */
export const createFridaPool = (
    customOptions: Schema.Codec.Encoded<typeof ConfigSchema>
): VitestNode.PoolRunnerInitializer => {
    return {
        name: "frida-pool",
        createPoolWorker: (options: VitestNode.PoolOptions) =>
            new FridaPoolWorker(options, Schema.decodeUnknownSync(ConfigSchema)(customOptions)),
    };
};
