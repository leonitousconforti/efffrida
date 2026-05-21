import type * as Scope from "effect/Scope";

import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Match from "effect/Match";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";

import type * as FridaSession from "../FridaSession.ts";

import * as Frida from "frida";

import * as FridaDevice from "../FridaDevice.ts";
import * as FridaSessionError from "../FridaSessionError.ts";

/** @internal */
export const FridaSessionTypeId: FridaSession.FridaSessionTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaSession"
) as FridaSession.FridaSessionTypeId;

/** @internal */
export const Tag = Context.Service<FridaSession.FridaSession>("@efffrida/frida-tools/FridaSession");

/** @internal */
export const isFridaSession = (u: unknown): u is FridaSession.FridaSession =>
    Predicate.hasProperty(u, FridaSessionTypeId);

/** @internal */
export const resume = (session: Frida.Session): Effect.Effect<void, FridaSessionError.FridaSessionError, never> =>
    Effect.tryPromise({
        try: (signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            return session.resume(cancellable);
        },
        catch: (cause) =>
            new FridaSessionError.FridaSessionError({
                when: "resume",
                cause,
            }),
    });

/** @internal */
export const detach = (session: Frida.Session): Effect.Effect<void, FridaSessionError.FridaSessionError, never> =>
    Effect.tryPromise({
        try: (signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            return session.detach(cancellable);
        },
        catch: (cause) =>
            new FridaSessionError.FridaSessionError({
                when: "detach",
                cause,
            }),
    });

/** @internal */
export const frontmost = (
    options?: Frida.FrontmostQueryOptions | undefined
): Effect.Effect<Frida.Application, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> =>
    Effect.flatMap(FridaDevice.FridaDevice, ({ device }) =>
        Effect.tryPromise((signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            return device.getFrontmostApplication(options, cancellable);
        })
    ).pipe(
        Effect.flatMap(Effect.fromNullishOr),
        Effect.mapError(
            (cause) =>
                new FridaSessionError.FridaSessionError({
                    when: "attach",
                    cause,
                })
        )
    );

/** @internal */
export const spawn = (
    program: string | ReadonlyArray<string>,
    options?: Frida.SpawnOptions | undefined
): Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope> => {
    const acquire = Effect.flatMap(FridaDevice.FridaDevice, ({ device }) =>
        Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return device.spawn(program as string | Array<string>, options, cancellable);
            },
            catch: (cause) =>
                new FridaSessionError.FridaSessionError({
                    when: "spawn",
                    cause,
                }),
        })
    );

    const release = (pid: number) =>
        Effect.flatMap(FridaDevice.FridaDevice, () =>
            Effect.promise((signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                console.log(`Killing process with PID ${pid}...`);
                return Promise.resolve();
                // return device.kill(pid, cancellable);
            })
        );

    const resource = Effect.acquireRelease(acquire, release);
    return resource;
};

/** @internal */
export const attach = (
    target: Frida.TargetProcess,
    options?: Frida.SessionOptions | undefined
): Effect.Effect<
    FridaSession.FridaSession,
    FridaSessionError.FridaSessionError,
    FridaDevice.FridaDevice | Scope.Scope
> => {
    const detached = Deferred.makeUnsafe<
        {
            reason: Frida.SessionDetachReason;
            crash: Option.Option<{
                pid: number;
                processName: string;
                summary: string;
                report: string;
                parameters: unknown;
            }>;
        },
        FridaSessionError.FridaSessionError
    >();

    const onDetached = (reason: Frida.SessionDetachReason, crash: Frida.Crash | null): void => {
        Deferred.doneUnsafe(
            detached,
            Effect.succeed({
                reason,
                crash: Option.fromNullOr(crash).pipe(
                    Option.map((c) => ({
                        pid: c.pid,
                        processName: c.processName,
                        summary: c.summary,
                        report: c.report,
                        parameters: c.parameters,
                    }))
                ),
            })
        );
    };

    const acquire = Effect.flatMap(FridaDevice.FridaDevice, ({ device }) =>
        Effect.tryPromise({
            try: (signal) => {
                const cancellable = new Frida.Cancellable();
                signal.onabort = () => cancellable.cancel();
                return device.attach(target, options, cancellable);
            },
            catch: (cause) =>
                new FridaSessionError.FridaSessionError({
                    when: "attach",
                    cause,
                }),
        })
    );

    const release = (session: Frida.Session) =>
        Effect.promise((signal) => {
            const cancellable = new Frida.Cancellable();
            signal.onabort = () => cancellable.cancel();
            session.detached.disconnect(onDetached);
            return session.detach(cancellable);
        });

    const resource = Effect.acquireRelease(acquire, release);
    return Effect.map(resource, (session) => {
        session.detached.connect(onDetached);

        return {
            session,
            pid: session.pid,
            detached: detached,
            resume: resume(session),
            detach: detach(session),
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
            [FridaSessionTypeId]: FridaSessionTypeId,
        } as const;
    });
};

/** @internal */
export const layer = (
    target: number | string | ReadonlyArray<string>,
    options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
): Layer.Layer<FridaSession.FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> =>
    Layer.effect(
        Tag,
        Effect.gen(function* () {
            const { device } = yield* FridaDevice.FridaDevice;

            const pid = yield* Match.value(target).pipe(
                Match.when(Match.number, (proc) => Effect.succeed(proc)),
                Match.when(Match.string, (proc) => spawn(proc)),
                Match.orElse((proc) => spawn(proc))
            );

            const session = yield* attach(pid, options);

            if (typeof target !== "number") {
                yield* Effect.tryPromise({
                    try: (signal) => {
                        const cancellable = new Frida.Cancellable();
                        signal.onabort = () => cancellable.cancel();
                        return device.resume(session.pid, cancellable);
                    },
                    catch: (cause) =>
                        new FridaSessionError.FridaSessionError({
                            when: "resume",
                            cause,
                        }),
                });
            }

            return session;
        })
    );

/** @internal */
export const layerFrontmost = (
    options?: Frida.FrontmostQueryOptions | undefined
): Layer.Layer<FridaSession.FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> =>
    Layer.unwrap(Effect.map(frontmost(options), (app) => layer(app.pid)));
