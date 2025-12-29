/**
 * @since 1.0.0
 * @category Class
 */

import "frida-il2cpp-bridge";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Equivalence from "effect/Equivalence";
import * as Function from "effect/Function";
import * as Tuple from "effect/Tuple";

import * as Il2CppEquivalence from "./Equivalence.ts";

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
export const classCached: Effect.Effect<
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, never, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(Function.tupled(class_), Equivalence.tuple(Il2CppEquivalence.image, Equivalence.string)),
    Function.untupled
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryClassCached: Effect.Effect<
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(Function.tupled(tryClass), Equivalence.tuple(Il2CppEquivalence.image, Equivalence.string)),
    Function.untupled
);

/**
 * @since 1.0.0
 * @category Class
 */
export const fields = (klass: Il2Cpp.Class): Effect.Effect<ReadonlyArray<Il2Cpp.Field>, never, never> =>
    Effect.sync(() => klass.fields);

/**
 * @since 1.0.0
 * @category Class
 */
export const field = Function.dual<
    (
        name: string
    ) => <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class
    ) => Effect.Effect<Il2Cpp.Field<T>, never, never>,
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ) => Effect.Effect<Il2Cpp.Field<T>, never, never>
>(
    2,
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ): Effect.Effect<Il2Cpp.Field<T>, never, never> => Effect.sync(() => klass.field<T>(name))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryField = Function.dual<
    (
        name: string
    ) => <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class
    ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>,
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>
>(
    2,
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ): Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never> =>
        Effect.try({
            try: () => klass.field<T>(name),
            catch: () => new Cause.NoSuchElementException(`No field with name ${name}`),
        }).pipe(Effect.flatMap(Effect.fromNullable))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const fieldCached: Effect.Effect<
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ) => Effect.Effect<Il2Cpp.Field<T>, never, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(Function.tupled(field), Equivalence.tuple(Il2CppEquivalence.class, Equivalence.string)),
    (tupled) =>
        Function.untupled(tupled) as <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
            klass: Il2Cpp.Class,
            name: string
        ) => Effect.Effect<Il2Cpp.Field<T>, never, never>
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryFieldCached: Effect.Effect<
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(Function.tupled(tryField), Equivalence.tuple(Il2CppEquivalence.class, Equivalence.string)),
    (tupled) =>
        Function.untupled(tupled) as <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
            klass: Il2Cpp.Class,
            name: string
        ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>
);

/**
 * @since 1.0.0
 * @category Class
 */
export const methods = (klass: Il2Cpp.Class): Effect.Effect<ReadonlyArray<Il2Cpp.Method>, never, never> =>
    Effect.sync(() => klass.methods);

/**
 * @since 1.0.0
 * @category Class
 */
export const method = Function.dual<
    (
        name: string,
        parameterCount?: number | undefined
    ) => <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class
    ) => Effect.Effect<Il2Cpp.Method<T>, never, never>,
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method<T>, never, never>
>(
    (_arguments) => typeof _arguments[1] === "string",
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ): Effect.Effect<Il2Cpp.Method<T>, never, never> => Effect.sync(() => klass.method<T>(name, parameterCount))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryMethod = Function.dual<
    (
        name: string,
        parameterCount?: number | undefined
    ) => <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class
    ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>,
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>
>(
    (_arguments) => typeof _arguments[1] === "string",
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ): Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never> =>
        Effect.try({
            try: () => klass.tryMethod<T>(name, parameterCount),
            catch: () => new Cause.NoSuchElementException(`No method with name ${name}`),
        }).pipe(Effect.flatMap(Effect.fromNullable))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const methodCached: Effect.Effect<
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method<T>, never, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(
        Function.tupled(method),
        Equivalence.mapInput(
            Equivalence.tuple(Il2CppEquivalence.class, Equivalence.string, Equivalence.strict<number | undefined>()),
            (tuple) => Tuple.make(tuple[0], tuple[1], tuple[2] ?? undefined)
        )
    ),
    (tupled) =>
        Function.untupled(tupled) as <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
            klass: Il2Cpp.Class,
            name: string,
            parameterCount?: number | undefined
        ) => Effect.Effect<Il2Cpp.Method<T>, never, never>
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryMethodCached: Effect.Effect<
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(
        Function.tupled(tryMethod),
        Equivalence.mapInput(
            Equivalence.tuple(Il2CppEquivalence.class, Equivalence.string, Equivalence.strict<number | undefined>()),
            (tuple) => Tuple.make(tuple[0], tuple[1], tuple[2] ?? undefined)
        )
    ),
    (tupled) =>
        Function.untupled(tupled) as <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
            klass: Il2Cpp.Class,
            name: string,
            parameterCount?: number | undefined
        ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>
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

/**
 * @since 1.0.0
 * @category Class
 */
export const nestedCached: Effect.Effect<
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, never, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(Function.tupled(nested), Equivalence.tuple(Il2CppEquivalence.class, Equivalence.string)),
    Function.untupled
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryNestedCached: Effect.Effect<
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>,
    never,
    never
> = Effect.map(
    Effect.cachedFunction(Function.tupled(tryNested), Equivalence.tuple(Il2CppEquivalence.class, Equivalence.string)),
    Function.untupled
);
