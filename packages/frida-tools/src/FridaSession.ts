/**
 * Frida sessions
 *
 * @since 1.0.0
 */

import type * as Cause from "effect/Cause";
import type * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import type * as Frida from "frida";
import type * as FridaDevice from "./FridaDevice.ts";
import type * as FridaSessionError from "./FridaSessionError.ts";

import * as internal from "./internal/session.ts";

/**
 * @since 1.0.0
 * @category Type ids
 */
export const FridaSessionTypeId: unique symbol = internal.FridaSessionTypeId;

/**
 * @since 1.0.0
 * @category Type ids
 */
export type FridaSessionTypeId = typeof FridaSessionTypeId;

/**
 * @since 1.0.0
 * @category Models
 */
export interface FridaSession {
    readonly session: Frida.Session;
    readonly [FridaSessionTypeId]: typeof FridaSessionTypeId;
    readonly resume: Effect.Effect<void, Cause.UnknownException>;
    readonly enableChildGating: Effect.Effect<void, Cause.UnknownException>;
    readonly disableChildGating: Effect.Effect<void, Cause.UnknownException>;
    setupPeerConnection(options?: Frida.PeerOptions | undefined): Effect.Effect<void, Cause.UnknownException>;
    joinPortal(
        address: string,
        options?: Frida.PortalOptions | undefined
    ): Effect.Effect<Frida.PortalMembership, Cause.UnknownException>;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export const FridaSession: Context.Tag<FridaSession, FridaSession> = internal.Tag;

/**
 * @since 1.0.0
 * @category Predicates
 */
export const isFridaSession: (u: unknown) => u is FridaSession = internal.isFridaSession;

/**
 * @since 1.0.0
 * @category Frida
 */
export const frontmost: (
    options?: Frida.FrontmostQueryOptions | undefined
) => Effect.Effect<Frida.Application, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> =
    internal.frontmost;

/**
 * @since 1.0.0
 * @category Frida
 */
export const spawn: (
    program: string | ReadonlyArray<string>,
    options?: Frida.SpawnOptions | undefined
) => Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope> = internal.spawn;

/**
 * @since 1.0.0
 * @category Frida
 */
export const attach: (
    target: Frida.TargetProcess,
    options?: Frida.SessionOptions | undefined
) => Effect.Effect<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope> =
    internal.attach;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layer: (
    target: number | string | ReadonlyArray<string>,
    options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> = internal.layer;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerFrontmost: (
    options?: Frida.FrontmostQueryOptions | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice> = internal.layerFrontmost;
