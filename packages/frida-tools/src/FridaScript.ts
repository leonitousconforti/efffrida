/**
 * Frida scripts
 *
 * @since 1.0.0
 */

import type * as FileSystem from "@effect/platform/FileSystem";
import type * as Path from "@effect/platform/Path";
import type * as Context from "effect/Context";
import type * as Deferred from "effect/Deferred";
import type * as Duration from "effect/Duration";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type * as Option from "effect/Option";
import type * as ParseResult from "effect/ParseResult";
import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import type * as Sink from "effect/Sink";
import type * as Stream from "effect/Stream";
import type * as Frida from "frida";
import type * as FridaSession from "./FridaSession.ts";
import type * as FridaSessionError from "./FridaSessionError.ts";

import * as internal from "./internal/script.ts";

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
    readonly callExport: <A, I, R>(
        exportName: string,
        schema: Schema.Schema<A, I, R>
    ) => (...args: Array<any>) => Effect.Effect<A, FridaSessionError.FridaSessionError | ParseResult.ParseError, R>;
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
 * @category Options
 */
export interface LoadOptions extends Frida.ScriptOptions, Frida.CompilerOptions {
    readonly messageMailboxCapacity?:
        | number
        | {
              readonly capacity?: number;
              readonly strategy?: "suspend" | "dropping" | "sliding";
          }
        | undefined;
    readonly streamShareOptions?:
        | {
              readonly capacity: "unbounded";
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.DurationInput | undefined;
          }
        | {
              readonly capacity: number;
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.DurationInput | undefined;
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
    ): Effect.Effect<string, FridaSessionError.FridaSessionError, Scope.Scope>;
    (
        options?: Frida.CompilerOptions | undefined
    ): (entrypoint: string) => Effect.Effect<string, FridaSessionError.FridaSessionError, Scope.Scope>;
} = internal.compile;

/**
 * @since 1.0.0
 * @category Frida
 */
export const load: {
    (
        entrypoint: URL,
        options?: LoadOptions | undefined
    ): Effect.Effect<
        FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >;
    (
        options?: LoadOptions | undefined
    ): (
        entrypoint: URL
    ) => Effect.Effect<
        FridaScript,
        FridaSessionError.FridaSessionError,
        Path.Path | FridaSession.FridaSession | Scope.Scope
    >;
} = internal.load;

/**
 * @since 1.0.0
 * @category Layers
 */
export const layer: {
    (
        entrypoint: URL,
        options?: LoadOptions | undefined
    ): Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>;
    (
        options?: LoadOptions | undefined
    ): (entrypoint: URL) => Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>;
} = internal.layer;

/**
 * @since 1.0.0
 * @category Frida
 */
export const watch: {
    <A, E, R>(
        effect: Effect.Effect<A, E, R>,
        entrypoint: URL,
        options?: LoadOptions | undefined
    ): Effect.Effect<
        void,
        E | FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript>
    >;
    (
        entrypoint: URL,
        options?: LoadOptions | undefined
    ): <A, E, R>(
        effect: Effect.Effect<A, E, R>
    ) => Effect.Effect<
        void,
        E | FridaSessionError.FridaSessionError,
        FileSystem.FileSystem | FridaSession.FridaSession | Exclude<R, FridaScript>
    >;
} = internal.watch;
