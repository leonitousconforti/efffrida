---
title: Class.ts
nav_order: 2
parent: Modules
---

## Class.ts overview

Since v1.0.0

---

## Exports Grouped by Category

- [Class](#class)
  - [class](#class-1)
  - [classCached](#classcached)
  - [field](#field)
  - [fieldCached](#fieldcached)
  - [fields](#fields)
  - [method](#method)
  - [methodCached](#methodcached)
  - [methods](#methods)
  - [nested](#nested)
  - [nestedCached](#nestedcached)
  - [tryClass](#tryclass)
  - [tryClassCached](#tryclasscached)
  - [tryField](#tryfield)
  - [tryFieldCached](#tryfieldcached)
  - [tryMethod](#trymethod)
  - [tryMethodCached](#trymethodcached)
  - [tryNested](#trynested)
  - [tryNestedCached](#trynestedcached)

---

# Class

## class

**Signature**

```ts
declare const class: ((name: string) => (image: Il2Cpp.Image) => Effect.Effect<Il2Cpp.Class, never, never>) & ((image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, never, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L30)

Since v1.0.0

## classCached

**Signature**

```ts
declare const classCached: Effect.Effect<
  (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, never, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L51)

Since v1.0.0

## field

**Signature**

```ts
declare const field: ((
  name: string
) => <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
  klass: Il2Cpp.Class
) => Effect.Effect<Il2Cpp.Field<T>, never, never>) &
  (<T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
    klass: Il2Cpp.Class,
    name: string
  ) => Effect.Effect<Il2Cpp.Field<T>, never, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L84)

Since v1.0.0

## fieldCached

**Signature**

```ts
declare const fieldCached: Effect.Effect<
  <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
    klass: Il2Cpp.Class,
    name: string
  ) => Effect.Effect<Il2Cpp.Field<T>, never, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L132)

Since v1.0.0

## fields

**Signature**

```ts
declare const fields: (klass: Il2Cpp.Class) => Effect.Effect<ReadonlyArray<Il2Cpp.Field>, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L77)

Since v1.0.0

## method

**Signature**

```ts
declare const method: ((
  name: string,
  parameterCount?: number | undefined
) => <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
  klass: Il2Cpp.Class
) => Effect.Effect<Il2Cpp.Method<T>, never, never>) &
  (<T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
    klass: Il2Cpp.Class,
    name: string,
    parameterCount?: number | undefined
  ) => Effect.Effect<Il2Cpp.Method<T>, never, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L179)

Since v1.0.0

## methodCached

**Signature**

```ts
declare const methodCached: Effect.Effect<
  <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
    klass: Il2Cpp.Class,
    name: string,
    parameterCount?: number | undefined
  ) => Effect.Effect<Il2Cpp.Method<T>, never, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L233)

Since v1.0.0

## methods

**Signature**

```ts
declare const methods: (klass: Il2Cpp.Class) => Effect.Effect<ReadonlyArray<Il2Cpp.Method>, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L172)

Since v1.0.0

## nested

**Signature**

```ts
declare const nested: ((name: string) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Class, never, never>) &
  ((klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, never, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L289)

Since v1.0.0

## nestedCached

**Signature**

```ts
declare const nestedCached: Effect.Effect<
  (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, never, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L312)

Since v1.0.0

## tryClass

**Signature**

```ts
declare const tryClass: ((
  name: string
) => (image: Il2Cpp.Image) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>) &
  ((image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L37)

Since v1.0.0

## tryClassCached

**Signature**

```ts
declare const tryClassCached: Effect.Effect<
  (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L64)

Since v1.0.0

## tryField

**Signature**

```ts
declare const tryField: ((
  name: string
) => <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
  klass: Il2Cpp.Class
) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>) &
  (<T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
    klass: Il2Cpp.Class,
    name: string
  ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L106)

Since v1.0.0

## tryFieldCached

**Signature**

```ts
declare const tryFieldCached: Effect.Effect<
  <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
    klass: Il2Cpp.Class,
    name: string
  ) => Effect.Effect<Il2Cpp.Field<T>, Cause.NoSuchElementException, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L152)

Since v1.0.0

## tryMethod

**Signature**

```ts
declare const tryMethod: ((
  name: string,
  parameterCount?: number | undefined
) => <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
  klass: Il2Cpp.Class
) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>) &
  (<T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
    klass: Il2Cpp.Class,
    name: string,
    parameterCount?: number | undefined
  ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L204)

Since v1.0.0

## tryMethodCached

**Signature**

```ts
declare const tryMethodCached: Effect.Effect<
  <T extends Il2Cpp.Method.ReturnType = Il2Cpp.Method.ReturnType>(
    klass: Il2Cpp.Class,
    name: string,
    parameterCount?: number | undefined
  ) => Effect.Effect<Il2Cpp.Method<T>, Cause.NoSuchElementException, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L261)

Since v1.0.0

## tryNested

**Signature**

```ts
declare const tryNested: ((
  name: string
) => (klass: Il2Cpp.Class) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>) &
  ((klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L298)

Since v1.0.0

## tryNestedCached

**Signature**

```ts
declare const tryNestedCached: Effect.Effect<
  (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L325)

Since v1.0.0
