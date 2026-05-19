/**
 * @since 1.0.0
 * @category Class
 */

import "frida-il2cpp-bridge";

import * as Cache from "effect/Cache";
import * as Cause from "effect/Cause";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";

import { CacheCapacity } from "./Assembly.ts";

export {
    /**
     * @since 1.0.0
     * @category Cache
     */
    CacheCapacity,
} from "./Assembly.ts";

/** @internal */
class ImageNameKey extends Data.Class<{
    readonly image: Il2Cpp.Image;
    readonly name: string;
}> {}

/** @internal */
class ClassNameKey extends Data.Class<{
    readonly klass: Il2Cpp.Class;
    readonly name: string;
}> {}

/** @internal */
class MethodKey extends Data.Class<{
    readonly klass: Il2Cpp.Class;
    readonly name: string;
    readonly parameterCount: number | undefined;
}> {}

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
    (name: string) => (image: Il2Cpp.Image) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementError, never>,
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementError, never>
>(2, (image: Il2Cpp.Image, name: string) =>
    Effect.try({
        try: () => image.tryClass(name),
        catch: () => new Cause.NoSuchElementError(`No class with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullishOr))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const classCached: Effect.Effect<
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, never, never>,
    never,
    never
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) => Cache.make({ capacity, lookup: (key: ImageNameKey) => class_(key.image, key.name) })),
    Effect.map((cache) => (image: Il2Cpp.Image, name: string) => Cache.get(cache, new ImageNameKey({ image, name })))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryClassCached: Effect.Effect<
    (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementError, never>,
    never,
    never
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) =>
        Cache.make({
            lookup: (key: ImageNameKey) => tryClass(key.image, key.name),
            capacity,
        })
    ),
    Effect.map(
        (cache) => (image: Il2Cpp.Image, name: string) =>
            Cache.get(
                cache,
                new ImageNameKey({
                    image,
                    name,
                })
            )
    )
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
    ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementError, never>,
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementError, never>
>(
    2,
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ): Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementError, never> =>
        Effect.try({
            try: () => klass.field<T>(name),
            catch: () => new Cause.NoSuchElementError(`No field with name ${name}`),
        }).pipe(Effect.flatMap(Effect.fromNullishOr))
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
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) =>
        Cache.make({
            lookup: (key: ClassNameKey) => field(key.klass, key.name),
            capacity,
        })
    ),
    Effect.map(
        (cache) =>
            ((klass: Il2Cpp.Class, name: string) =>
                Cache.get(
                    cache,
                    new ClassNameKey({
                        klass,
                        name,
                    })
                )) as <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
                klass: Il2Cpp.Class,
                name: string
            ) => Effect.Effect<Il2Cpp.Field<T>, never, never>
    )
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryFieldCached: Effect.Effect<
    <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
        klass: Il2Cpp.Class,
        name: string
    ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementError, never>,
    never,
    never
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) =>
        Cache.make({
            lookup: (key: ClassNameKey) => tryField(key.klass, key.name),
            capacity,
        })
    ),
    Effect.map(
        (cache) =>
            ((klass: Il2Cpp.Class, name: string) =>
                Cache.get(
                    cache,
                    new ClassNameKey({
                        klass,
                        name,
                    })
                )) as <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
                klass: Il2Cpp.Class,
                name: string
            ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementError, never>
    )
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
    ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementError, never>,
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementError, never>
>(
    (_arguments) => typeof _arguments[1] === "string",
    <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
        klass: Il2Cpp.Class,
        name: string,
        parameterCount?: number | undefined
    ): Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementError, never> =>
        Effect.try({
            try: () => klass.tryMethod<T>(name, parameterCount),
            catch: () => new Cause.NoSuchElementError(`No method with name ${name}`),
        }).pipe(Effect.flatMap(Effect.fromNullishOr))
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
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) =>
        Cache.make({
            lookup: (key: MethodKey) => method(key.klass, key.name, key.parameterCount),
            capacity,
        })
    ),
    Effect.map(
        (cache) =>
            ((klass: Il2Cpp.Class, name: string, parameterCount?: number) =>
                Cache.get(cache, new MethodKey({ klass, name, parameterCount }))) as <
                T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType,
            >(
                klass: Il2Cpp.Class,
                name: string,
                parameterCount?: number | undefined
            ) => Effect.Effect<Il2Cpp.Method<T>, never, never>
    )
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
    ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementError, never>,
    never,
    never
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) =>
        Cache.make({
            lookup: (key: MethodKey) => tryMethod(key.klass, key.name, key.parameterCount),
            capacity,
        })
    ),
    Effect.map(
        (cache) =>
            ((klass: Il2Cpp.Class, name: string, parameterCount?: number) =>
                Cache.get(cache, new MethodKey({ klass, name, parameterCount }))) as <
                T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType,
            >(
                klass: Il2Cpp.Class,
                name: string,
                parameterCount?: number | undefined
            ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementError, never>
    )
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
    (name: string) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementError, never>,
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementError, never>
>(2, (klass: Il2Cpp.Class, name: string) =>
    Effect.try({
        try: () => klass.tryNested(name),
        catch: () => new Cause.NoSuchElementError(`No nested class with name ${name}`),
    }).pipe(Effect.flatMap(Effect.fromNullishOr))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const nestedCached: Effect.Effect<
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, never, never>,
    never,
    never
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) => Cache.make({ capacity, lookup: (key: ClassNameKey) => nested(key.klass, key.name) })),
    Effect.map((cache) => (klass: Il2Cpp.Class, name: string) => Cache.get(cache, new ClassNameKey({ klass, name })))
);

/**
 * @since 1.0.0
 * @category Class
 */
export const tryNestedCached: Effect.Effect<
    (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementError, never>,
    never,
    never
> = CacheCapacity.pipe(
    Effect.flatMap((capacity) =>
        Cache.make({
            lookup: (key: ClassNameKey) => tryNested(key.klass, key.name),
            capacity,
        })
    ),
    Effect.map(
        (cache) => (klass: Il2Cpp.Class, name: string) =>
            Cache.get(
                cache,
                new ClassNameKey({
                    klass,
                    name,
                })
            )
    )
);
