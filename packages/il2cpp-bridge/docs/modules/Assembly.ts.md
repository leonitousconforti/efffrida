---
title: Assembly.ts
nav_order: 1
parent: Modules
---

## Assembly.ts overview

Since v1.0.0

---

## Exports Grouped by Category

- [Assembly](#assembly)
  - [assembly](#assembly-1)
  - [assemblyCached](#assemblycached)
  - [attach](#attach)
  - [tryAssembly](#tryassembly)
  - [tryAssemblyCached](#tryassemblycached)
- [Cache](#cache)
  - [CacheCapacity](#cachecapacity)

---

# Assembly

## assembly

**Signature**

```ts
declare const assembly: (name: string) => Effect.Effect<Il2Cpp.Assembly, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L28)

Since v1.0.0

## assemblyCached

**Signature**

```ts
declare const assemblyCached: Effect.Effect<
  (name: string) => Effect.Effect<Il2Cpp.Assembly, never, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L45)

Since v1.0.0

## attach

**Signature**

```ts
declare const attach: Effect.Effect<Il2Cpp.Thread, never, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L63)

Since v1.0.0

## tryAssembly

**Signature**

```ts
declare const tryAssembly: (name: string) => Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L35)

Since v1.0.0

## tryAssemblyCached

**Signature**

```ts
declare const tryAssemblyCached: Effect.Effect<
  (name: string) => Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementError, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L54)

Since v1.0.0

# Cache

## CacheCapacity

**Signature**

```ts
declare const CacheCapacity: Context.Reference<number>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L19)

Since v1.0.0
