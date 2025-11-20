import type * as PlatformError from "@effect/platform/Error";
import type * as FridaDeviceAcquisitionError from "@efffrida/frida-tools/FridaDeviceAcquisitionError";
import type * as FridaSessionError from "@efffrida/frida-tools/FridaSessionError";
import type * as Option from "effect/Option";
import type * as Runtime from "effect/Runtime";
import type * as Frida from "frida";
import type * as VitestNode from "vitest/node";
import type { PoolWorker, WorkerRequest } from "vitest/node";

import * as NodeContext from "@effect/platform-node/NodeContext";
import * as Command from "@effect/platform/Command";
import * as CommandExecutor from "@effect/platform/CommandExecutor";
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
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

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

class ConfigSchema extends Schema.Struct({
    isolated: Schema.optionalWith(Schema.Boolean, { nullable: true }),
})
    .pipe(Schema.extend(DeviceSchema))
    .pipe(Schema.extend(AttachSchema)) {}

/**
 * @since 1.0.0
 * @category Tests
 */
export class FridaPoolWorker implements PoolWorker {
    readonly name = "frida-pool";

    private readonly customOptions: Schema.Schema.Type<typeof ConfigSchema>;
    private readonly managedRuntime: ManagedRuntime.ManagedRuntime<
        FridaScript.FridaScript,
        | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
        | PlatformError.PlatformError
        | FridaSessionError.FridaSessionError
    >;

    private readonly cancelables: Map<
        (arg: any) => void,
        Runtime.Cancel<
            unknown,
            | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError
            | PlatformError.PlatformError
            | FridaSessionError.FridaSessionError
        >
    >;

    constructor(_poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof ConfigSchema>) {
        this.customOptions = customOptions;
        this.cancelables = new Map();

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
        const ScriptLive = FridaScript.layer(new URL("../frida/agent.ts", import.meta.url), {
            externals: ["jsdom", "happy-dom", "@edge-runtime/vm"],
        }).pipe(Layer.provide(FridaLive));

        this.managedRuntime = ManagedRuntime.make(ScriptLive);
    }

    async start(): Promise<void> {
        const exit = await this.managedRuntime.runPromiseExit(Effect.void);
        if (Exit.isSuccess(exit)) return;
        throw Cause.pretty(exit.cause, { renderErrorCause: true });
    }

    async stop(): Promise<void> {
        return this.managedRuntime.dispose();
    }

    async send(message: WorkerRequest): Promise<void> {
        await this.managedRuntime.runPromise(
            Effect.flatMap(FridaScript.FridaScript, (fridaScript) =>
                fridaScript.callExport("onMessage", Schema.Void)(message)
            )
        );
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
                cancelable = this.managedRuntime.runCallback(
                    Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Stream.run(fridaScript.stream, sink))
                );
                break;

            case "error":
                cancelable = this.managedRuntime.runCallback(
                    Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Deferred.await(fridaScript.scriptError)),
                    { onExit: (exit) => (Exit.isSuccess(exit) ? callback(exit.value) : callback(exit.cause)) }
                );
                break;

            case "exit":
                cancelable = this.managedRuntime.runCallback(
                    Effect.flatMap(FridaScript.FridaScript, (fridaScript) => Deferred.await(fridaScript.destroyed)),
                    { onExit: () => callback(undefined) }
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
        return data;
    }
}

/**
 * @since 1.0.0
 * @category Tests
 */
export const createFridaPool = (
    customOptions: Schema.Schema.Encoded<typeof ConfigSchema>
): VitestNode.PoolRunnerInitializer => {
    const decoded = Schema.decodeUnknownSync(ConfigSchema)(customOptions);
    return {
        name: "frida-pool",
        createPoolWorker: (options: VitestNode.PoolOptions) => new FridaPoolWorker(options, decoded),
    };
};
