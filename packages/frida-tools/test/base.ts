import { Command, CommandExecutor } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { FridaDevice, FridaSession, FridaSessionError } from "@efffrida/frida-tools";
import { Effect, Layer } from "effect";

import * as Frida from "frida";

// Pick a device and a session/program
export const DeviceLive = FridaDevice.layerLocalDevice;
export const SessionLive = Layer.unwrapScoped(
    Effect.gen(function* () {
        const executor = yield* CommandExecutor.CommandExecutor;
        const command = Command.make("sleep", "infinity");
        const process = yield* executor.start(command);

        const session = yield* Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return Frida.attach(process.pid, {}, cancellable);
            },
            catch: (cause) =>
                new FridaSessionError.FridaSessionError({
                    cause,
                    when: "attach",
                }),
        });

        return Layer.succeed(FridaSession.FridaSession, {
            session,
            resume: Effect.tryPromise((signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return session.resume(cancellable);
            }),
            enableChildGating: Effect.tryPromise((signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return session.enableChildGating(cancellable);
            }),
            disableChildGating: Effect.tryPromise((signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return session.disableChildGating(cancellable);
            }),
            setupPeerConnection: (opts?: Frida.PeerOptions | undefined) =>
                Effect.tryPromise((signal) => {
                    const cancellable = new Frida.Cancellable();
                    signal.onabort = () => cancellable.cancel();
                    return session.setupPeerConnection(opts, cancellable);
                }),
            joinPortal: (address: string, opts?: Frida.PortalOptions | undefined) =>
                Effect.tryPromise((signal) => {
                    const cancellable = new Frida.Cancellable();
                    signal.onabort = () => cancellable.cancel();
                    return session.joinPortal(address, opts, cancellable);
                }),
            [FridaSession.FridaSessionTypeId]: FridaSession.FridaSessionTypeId,
        });
    })
);

export const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeContext.layer));
