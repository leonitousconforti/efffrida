/**
 * Frida scripts
 *
 * @since 1.0.0
 */

import type * as Context from "effect/Context";
import type * as Deferred from "effect/Deferred";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import type * as Sink from "effect/Sink";
import type * as Stream from "effect/Stream";
import type * as Frida from "frida";
import type * as FridaDevice from "./FridaDevice.js";
import type * as FridaSession from "./FridaSession.js";
import type * as FridaSessionError from "./FridaSessionError.js";

import * as internal from "./internal/script.js";

/**
 * @since 1.0.0
 * @category Type ids
 */
export const FridaScriptTypeId: unique symbol = internal.FridaScriptTypeId;

/**
 * @since 1.0.0
 * @category Type ids
 */
export type FridaScriptTypeId = typeof FridaScriptTypeId;

/**
 * @since 1.0.0
 * @category Models
 */
export interface FridaScript {
    readonly script: Frida.Script;
    readonly destroyed: Deferred.Deferred<void, never>;
    readonly [FridaScriptTypeId]: typeof FridaScriptTypeId;
    readonly stream: Stream.Stream<
        { message: any; data: Option.Option<Buffer> },
        FridaSessionError.FridaSessionError,
        never
    >;
    readonly sink: Sink.Sink<
        void,
        { message: any; data: Option.Option<Buffer> },
        never,
        FridaSessionError.FridaSessionError,
        never
    >;
    readonly callExport: (
        exportName: string
    ) => (...args: Array<any>) => Effect.Effect<unknown, FridaSessionError.FridaSessionError, never>;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export const FridaScript: Context.Tag<FridaScript, FridaScript> = internal.Tag;

/**
 * @since 1.0.0
 * @category Predicates
 */
export const isFridaScript: (u: unknown) => u is FridaScript = internal.isFridaScript;

/**
 * @since 1.0.0
 * @category Frida
 */
export const load: {
    (
        source: string | Buffer,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ): Effect.Effect<
        FridaScript,
        FridaSessionError.FridaSessionError,
        FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
    >;
    (
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ): (
        source: string | Buffer
    ) => Effect.Effect<
        FridaScript,
        FridaSessionError.FridaSessionError,
        FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
    >;
} = internal.load;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layer: {
    (
        source: string | Buffer,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ): Layer.Layer<
        FridaScript,
        FridaSessionError.FridaSessionError,
        FridaDevice.FridaDevice | FridaSession.FridaSession
    >;
    (
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ): (
        source: string | Buffer
    ) => Layer.Layer<
        FridaScript,
        FridaSessionError.FridaSessionError,
        FridaDevice.FridaDevice | FridaSession.FridaSession
    >;
} = internal.layer;
