/**
 * @since 1.0.0
 * @category Class
 */

import "frida-il2cpp-bridge";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";

/**
 * @since 1.0.0
 * @category Class
 */
const class_ = (image: Il2Cpp.Image, name: string): Effect.Effect<Il2Cpp.Class, never, never> =>
    Effect.sync(() => image.class(name));

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
export const tryClass = (
    image: Il2Cpp.Image,
    name: string
): Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never> =>
    Effect.try({
        try: () => image.tryClass(name),
        catch: () => new Cause.NoSuchElementException(`No class with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable));

/**
 * @since 1.0.0
 * @category Class
 */
export const field = (klass: Il2Cpp.Class, name: string): Effect.Effect<Il2Cpp.Field, never, never> =>
    Effect.sync(() => klass.field(name));

/**
 * @since 1.0.0
 * @category Class
 */
export const tryField = (
    klass: Il2Cpp.Class,
    name: string
): Effect.Effect<Il2Cpp.Field, Cause.NoSuchElementException, never> =>
    Effect.try({
        try: () => klass.tryField(name),
        catch: () => new Cause.NoSuchElementException(`No field with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable));

/**
 * @since 1.0.0
 * @category Class
 */
export const method = (
    klass: Il2Cpp.Class,
    name: string,
    parameterCount?: number | undefined
): Effect.Effect<Il2Cpp.Method, never, never> => Effect.sync(() => klass.method(name, parameterCount));

/**
 * @since 1.0.0
 * @category Class
 */
export const tryMethod = (
    klass: Il2Cpp.Class,
    name: string,
    parameterCount?: number | undefined
): Effect.Effect<Il2Cpp.Method, Cause.NoSuchElementException, never> =>
    Effect.try({
        try: () => klass.tryMethod(name, parameterCount),
        catch: () => new Cause.NoSuchElementException(`No method with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable));

/**
 * @since 1.0.0
 * @category Class
 */
export const nested = (klass: Il2Cpp.Class, name: string): Effect.Effect<Il2Cpp.Class, never, never> =>
    Effect.sync(() => klass.nested(name));

/**
 * @since 1.0.0
 * @category Class
 */
export const tryNested = (
    klass: Il2Cpp.Class,
    name: string
): Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never> =>
    Effect.try({
        try: () => klass.tryNested(name),
        catch: () => new Cause.NoSuchElementException(`No nested class with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullable));
