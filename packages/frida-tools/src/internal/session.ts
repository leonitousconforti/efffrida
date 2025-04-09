import type * as Scope from "effect/Scope";
import type * as Frida from "frida";
import type * as FridaSession from "../FridaSession.js";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Predicate from "effect/Predicate";
import * as FridaDevice from "../FridaDevice.js";
import * as FridaSessionError from "../FridaSessionError.js";

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
                try: () => device.spawn(program, options),
                catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "spawn" }),
            }),
            (pid) => Effect.promise(() => device.kill(pid))
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
                    try: () => device.attach(target, options),
                    catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "attach" }),
                }),
                (session) => ({ session, [FridaSessionTypeId]: FridaSessionTypeId }) as const
            ),
            ({ session }: FridaSession.FridaSession) => Effect.promise(() => session.detach())
        )
    );

/** @internal */
export const layer = (
    target: string,
    options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
): Layer.Layer<FridaSession.FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> =>
    Layer.scoped(
        Tag,
        Effect.gen(function* () {
            const pid = yield* spawn(target, options);
            const session = yield* attach(pid, options);
            return session;
        })
    );
