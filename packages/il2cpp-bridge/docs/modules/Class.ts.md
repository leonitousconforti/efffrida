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
  - [field](#field)
  - [method](#method)
  - [nested](#nested)
  - [tryClass](#tryclass)
  - [tryField](#tryfield)
  - [tryMethod](#trymethod)
  - [tryNested](#trynested)

---

# Class

## class

**Signature**

```ts
declare const class: (image: Il2Cpp.Image, name: string) => Effect.Effect<Il2Cpp.Class, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L23)

Since v1.0.0

## field

**Signature**

```ts
declare const field: (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Field, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L43)

Since v1.0.0

## method

**Signature**

```ts
declare const method: (
  klass: Il2Cpp.Class,
  name: string,
  parameterCount?: number | undefined
) => Effect.Effect<Il2Cpp.Method, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L63)

Since v1.0.0

## nested

**Signature**

```ts
declare const nested: (klass: Il2Cpp.Class, name: string) => Effect.Effect<Il2Cpp.Class, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L87)

Since v1.0.0

## tryClass

**Signature**

```ts
declare const tryClass: (
  image: Il2Cpp.Image,
  name: string
) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L30)

Since v1.0.0

## tryField

**Signature**

```ts
declare const tryField: (
  klass: Il2Cpp.Class,
  name: string
) => Effect.Effect<Il2Cpp.Field, Cause.NoSuchElementException, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L50)

Since v1.0.0

## tryMethod

**Signature**

```ts
declare const tryMethod: (
  klass: Il2Cpp.Class,
  name: string,
  parameterCount?: number | undefined
) => Effect.Effect<Il2Cpp.Method, Cause.NoSuchElementException, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L73)

Since v1.0.0

## tryNested

**Signature**

```ts
declare const tryNested: (
  klass: Il2Cpp.Class,
  name: string
) => Effect.Effect<Il2Cpp.Class, Cause.NoSuchElementException, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Class.ts#L94)

Since v1.0.0
