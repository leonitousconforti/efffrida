/**
 * @since 1.0.0
 * @category Class
 */

import "frida-il2cpp-bridge";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";

/**
 * @since 1.0.0
 * @category Class
 */
const class_ = Function.dual<
    (name: string) => (image: Il2Cpp.Image) => Effect.Effect<Il2Cpp.Class, never, never>,
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, never, never>
>(2, (image: Il2Cpp.Image, name: string) => Effect.sync(() => image.class(name)));

export {
    /**
     * @since 1.0.0
     * @category Class
     */
    class_ as class,
};

/**
 * @since 1.0.0
 * @category Class
 */
export const tryClass = Function.dual<
    (name: string) => (image: Il2Cpp.Image) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>,
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>
>(2, (image: Il2Cpp.Image, name: string) =>
    Effect.try({
        try: () => image.tryClass(name),
        catch: () => new Cause.NoSuchElementException(`No class with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const field = Function.dual<
    (name: string) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Field, never, never>,
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Field, never, never>
>(2, (klass: Il2Cpp.Class, name: string) => Effect.sync(() => klass.field(name)));

/**
 * @since 1.0.0
 * @category Class
 */
export const tryField = Function.dual<
    (name: string) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Field, Cause.NoSuchElementException, never>,
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Field, Cause.NoSuchElementException, never>
>(2, (klass: Il2Cpp.Class, name: string) =>
    Effect.try({
        try: () => klass.tryField(name),
        catch: () => new Cause.NoSuchElementException(`No field with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const method = Function.dual<
    (
        name: string,
        parameterCount?: number | undefined
    ) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Method, never, never>,
    (
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method, never, never>
>(
    (_arguments) => typeof _arguments[1] === "string",
    (klass: Il2Cpp.Class, name: string, parameterCount?: number | undefined) =>
        Effect.sync(() => klass.method(name, parameterCount))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryMethod = Function.dual<
    (
        name: string,
        parameterCount?: number | undefined
    ) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Method, Cause.NoSuchElementException, never>,
    (
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method, Cause.NoSuchElementException, never>
>(
    (_arguments) => typeof _arguments[1] === "string",
    (klass: Il2Cpp.Class, name: string, parameterCount?: number | undefined) =>
        Effect.try({
            try: () => klass.tryMethod(name, parameterCount),
            catch: () => new Cause.NoSuchElementException(`No method with name ${name}`),
        }).pipe(Effect.flatMap(Effect.fromNullable))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const nested = Function.dual<
    (name: string) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Class, never, never>,
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, never, never>
>(2, (klass: Il2Cpp.Class, name: string) => Effect.sync(() => klass.nested(name)));

/**
 * @since 1.0.0
 * @category Class
 */
export const tryNested = Function.dual<
    (name: string) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>,
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>
>(2, (klass: Il2Cpp.Class, name: string) =>
    Effect.try({
        try: () => klass.tryNested(name),
        catch: () => new Cause.NoSuchElementException(`No nested class with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable))
);
