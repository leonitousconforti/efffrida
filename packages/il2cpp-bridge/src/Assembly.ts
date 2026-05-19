/**
 * @since 1.0.0
 * @category Assembly
 */

import "frida-il2cpp-bridge";

import type * as Scope from "effect/Scope";

import * as Cache from "effect/Cache";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

/**
 * @since 1.0.0
 * @category Cache
 */
export const CacheCapacity: Context.Reference<number> = Context.Reference<number>(
    "@efffrida/il2cpp-bridge/CacheCapacity",
    { defaultValue: () => 100 }
);

/**
 * @since 1.0.0
 * @category Assembly
 */
export const assembly = (name: string): Effect.Effect<Il2Cpp.Assembly, never, never> =>
    Effect.sync(() => Il2Cpp.domain.assembly(name));

/**
 * @since 1.0.0
 * @category Assembly
 */
export const tryAssembly = (name: string): Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementError, never> =>
    Effect.try({
        try: () => Il2Cpp.domain.tryAssembly(name),
        catch: () => new Cause.NoSuchElementError(`No assembly with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullishOr));

/**
 * @since 1.0.0
 * @category Assembly
 */
export const assemblyCached: Effect.Effect<typeof assembly, never, never> = CacheCapacity.pipe(
    Effect.flatMap((capacity) => Cache.make({ capacity, lookup: assembly })),
    Effect.map((cache) => (name: string) => Cache.get(cache, name))
);

/**
 * @since 1.0.0
 * @category Assembly
 */
export const tryAssemblyCached: Effect.Effect<typeof tryAssembly, never, never> = CacheCapacity.pipe(
    Effect.flatMap((capacity) => Cache.make({ capacity, lookup: tryAssembly })),
    Effect.map((cache) => (name: string) => Cache.get(cache, name))
);

/**
 * @since 1.0.0
 * @category Assembly
 */
export const attach: Effect.Effect<Il2Cpp.Thread, never, Scope.Scope> = Effect.acquireRelease(
    Effect.sync(() => Il2Cpp.domain.attach()),
    (thread) => Effect.sync(() => thread.detach())
);
