import type * as Scope from "effect/Scope";
import type * as FridaSession from "../FridaSession.ts";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Match from "effect/Match";
import * as Predicate from "effect/Predicate";
import * as Frida from "frida";

import * as Console from "effect/Console";
import * as FridaDevice from "../FridaDevice.ts";
import * as FridaSessionError from "../FridaSessionError.ts";

/** @internal */
export const FridaSessionTypeId: FridaSession.FridaSessionTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaSession"
) as FridaSession.FridaSessionTypeId;

/** @internal */
export const Tag = Context.GenericTag<FridaSession.FridaSession>("@efffrida/frida-tools/FridaSession");

/** @internal */
export const isFridaSession = (u: unknown): u is FridaSession.FridaSession =>
    Predicate.hasProperty(u, FridaSessionTypeId);

/** @internal */
export const spawn = (
    program: string | Array<string>,
    options?: Frida.SpawnOptions | undefined
): Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope> =>
    Effect.flatMap(FridaDevice.FridaDevice, ({ device }) =>
        Effect.acquireRelease(
            Effect.tryPromise({
                try: (signal) => {
                    const cancellable = new Frida.Cancellable();
                    signal.onabort = () => cancellable.cancel();
                    return device.spawn(program, options, cancellable);
                },
                catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "spawn" }),
            }),
            (pid) =>
                Effect.promise((signal) => {
                    const cancellable = new Frida.Cancellable();
                    signal.onabort = () => cancellable.cancel();
                    return device.kill(pid);
                })
        )
    );

/** @internal */
export const attach = (
    target: Frida.TargetProcess,
    options?: Frida.SessionOptions | undefined
): Effect.Effect<
    FridaSession.FridaSession,
    FridaSessionError.FridaSessionError,
    FridaDevice.FridaDevice | Scope.Scope
> =>
    Effect.flatMap(FridaDevice.FridaDevice, ({ device }) =>
        Effect.acquireRelease(
            Effect.map(
                Effect.tryPromise({
                    try: (signal) => {
                        const cancellable = new Frida.Cancellable();
                        signal.onabort = () => cancellable.cancel();
                        return device.attach(target, options);
                    },
                    catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "attach" }),
                }),
                (session) =>
                    ({
                        session,
                        resume: Effect.tryPromise((signal) => {
                            const cancellable = new Frida.Cancellable();
                            signal.onabort = () => cancellable.cancel();
                            return session.resume(cancellable);
                        }),
                        enableChildGating: () =>
                            Effect.tryPromise((signal) => {
                                const cancellable = new Frida.Cancellable();
                                signal.onabort = () => cancellable.cancel();
                                return session.enableChildGating(cancellable);
                            }),
                        disableChildGating: () =>
                            Effect.tryPromise((signal) => {
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
                        [FridaSessionTypeId]: FridaSessionTypeId,
                    }) as const
            ),
            ({ session }: FridaSession.FridaSession) =>
                Effect.promise((signal) => {
                    const cancellable = new Frida.Cancellable();
                    signal.onabort = () => cancellable.cancel();
                    return session.detach(cancellable);
                })
        )
    )
        .pipe(
            Effect.timeoutFail({
                duration: "10 seconds",
                onTimeout: () =>
                    new FridaSessionError.FridaSessionError({
                        when: "attach",
                        cause: "operation timed out",
                    }),
            })
        )
        .pipe(Effect.tapError(Console.log));

/** @internal */
export const layer = (
    target: number | string | ReadonlyArray<string>,
    options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
): Layer.Layer<FridaSession.FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> =>
    Layer.scoped(
        Tag,
        Effect.gen(function* () {
            const pid = yield* Match.value(target).pipe(
                Match.when(Match.number, (pid) => Effect.succeed(pid)),
                Match.when(Match.string, (proc) => spawn(proc)),
                Match.orElse((proc) => spawn(proc as Array<string>))
            );
            const session = yield* attach(pid, options);
            return session;
        })
    );
