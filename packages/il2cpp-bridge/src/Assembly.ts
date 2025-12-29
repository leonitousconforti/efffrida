/**
 * @since 1.0.0
 * @category Assembly
 */

import "frida-il2cpp-bridge";

import type * as Scope from "effect/Scope";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Equivalence from "effect/Equivalence";

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
export const tryAssembly = (name: string): Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementException, never> =>
    Effect.try({
        try: () => Il2Cpp.domain.tryAssembly(name),
        catch: () => new Cause.NoSuchElementException(`No assembly with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable));

/**
 * @since 1.0.0
 * @category Assembly
 */
export const assemblyCached: Effect.Effect<typeof assembly, never, never> = Effect.cachedFunction(
    assembly,
    Equivalence.string
);

/**
 * @since 1.0.0
 * @category Assembly
 */
export const tryAssemblyCached: Effect.Effect<typeof tryAssembly, never, never> = Effect.cachedFunction(
    tryAssembly,
    Equivalence.string
);

/**
 * @since 1.0.0
 * @category Assembly
 */
export const attach: Effect.Effect<Il2Cpp.Thread, never, Scope.Scope> = Effect.acquireRelease(
    Effect.sync(() => Il2Cpp.domain.attach()),
    (thread) => Effect.sync(() => thread.detach())
);
