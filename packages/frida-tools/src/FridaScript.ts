/**
 * Frida scripts
 *
 * @since 1.0.0
 */

import type * as Context from "effect/Context";
import type * as Deferred from "effect/Deferred";
import type * as Duration from "effect/Duration";
import type * as Effect from "effect/Effect";
import type * as Exit from "effect/Exit";
import type * as FileSystem from "effect/FileSystem";
import type * as Layer from "effect/Layer";
import type * as Option from "effect/Option";
import type * as Path from "effect/Path";
import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import type * as Sink from "effect/Sink";
import type * as Stream from "effect/Stream";

import type * as FridaSession from "./FridaSession.ts";
import type * as FridaSessionError from "./FridaSessionError.ts";
import type * as Frida from "frida";

import * as internalCompiler from "./internal/compiler.ts";
import * as internalScript from "./internal/script.ts";

/**
 * @since 1.0.0
 * @category Type ids
 */
export const FridaScriptTypeId: unique symbol = internalScript.FridaScriptTypeId;

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
    readonly [FridaScriptTypeId]: typeof FridaScriptTypeId;
    readonly destroyed: Deferred.Deferred<void, never>;
    readonly scriptError: Deferred.Deferred<unknown, never>;
    readonly stream: Stream.Stream<
        { message: unknown; data: Option.Option<Buffer> },
        FridaSessionError.FridaSessionError,
        never
    >;
    readonly sink: Sink.Sink<
        void,
        { message: unknown; data: Option.Option<Buffer> },
        never,
        FridaSessionError.FridaSessionError,
        never
    >;
    readonly callExport: <A = unknown, R = never>(
        exportName: string,
        schema?: Schema.Decoder<A, R> | undefined
    ) => (...args: Array<any>) => Effect.Effect<A, FridaSessionError.FridaSessionError | Schema.SchemaError, R>;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export const FridaScript: Context.Service<FridaScript, FridaScript> = internalScript.Tag;

/**
 * @since 1.0.0
 * @category Predicates
 */
export const isFridaScript: (u: unknown) => u is FridaScript = internalScript.isFridaScript;

/**
 * @since 1.0.0
 * @category Options
 */
export interface LoadOptions extends Frida.ScriptOptions, Frida.CompilerOptions {
    readonly messageMailboxCapacity?:
        | {
              readonly capacity?: number | undefined;
              readonly strategy?: "suspend" | "dropping" | "sliding" | undefined;
          }
        | undefined;
    readonly streamShareOptions?:
        | {
              readonly capacity: "unbounded";
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.Input | undefined;
          }
        | {
              readonly capacity: number;
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.Input | undefined;
          }
        | undefined;
}

/**
 * @since 1.0.0
 * @category Frida
 */
export const compile: {
    (
        entrypoint: string,
        options?: Frida.CompilerOptions | undefined
    ): Effect.Effect<string, FridaSessionError.FridaSessionError>;
    (
        options?: Frida.CompilerOptions | undefined
    ): (entrypoint: string) => Effect.Effect<string, FridaSessionError.FridaSessionError>;
} = internalCompiler.compile;

/**
 * @since 1.0.0
 * @category Frida
 */
export const load: {
    (
        entrypoint: URL | string,
        options?: LoadOptions | undefined
    ): Effect.Effect<
        FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >;
    (
        options?: LoadOptions | undefined
    ): (
        entrypoint: URL | string
    ) => Effect.Effect<
        FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >;
} = internalScript.load;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layer: {
    (
        entrypoint: URL | string,
        options?: LoadOptions | undefined
    ): Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>;
    (
        options?: LoadOptions | undefined
    ): (
        entrypoint: URL | string
    ) => Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>;
} = internalScript.layer;

/**
 * @since 1.0.0
 * @category Frida
 */
export const watch: {
    <A, E, R>(
        effect: Effect.Effect<A, E, R>,
        entrypoint: URL | string,
        options?: LoadOptions | undefined
    ): Stream.Stream<
        Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
        FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript>
    >;
    (
        entrypoint: URL | string,
        options?: LoadOptions | undefined
    ): <A, E, R>(
        effect: Effect.Effect<A, E, R>
    ) => Stream.Stream<
        Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
        FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript>
    >;
} = internalScript.watch;

/**
 * Successes will be logged with info, failures with warning, defects with
 * error, and interruptions with debug.
 *
 * @since 1.0.0
 * @category Frida
 */
export const logWatchErrors: <A, E1, E2, R>(
    watchStream: Stream.Stream<Exit.Exit<A, E1>, E2, R>
) => Stream.Stream<Exit.Exit<A, E1>, E2, R> = internalScript.logWatchErrors;
