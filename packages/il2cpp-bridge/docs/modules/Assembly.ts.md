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

---

# Assembly

## assembly

**Signature**

```ts
declare const assembly: (name: string) => Effect.Effect<Il2Cpp.Assembly, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L18)

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

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L35)

Since v1.0.0

## attach

**Signature**

```ts
declare const attach: Effect.Effect<Il2Cpp.Thread, never, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L53)

Since v1.0.0

## tryAssembly

**Signature**

```ts
declare const tryAssembly: (name: string) => Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementException, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L25)

Since v1.0.0

## tryAssemblyCached

**Signature**

```ts
declare const tryAssemblyCached: Effect.Effect<
  (name: string) => Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementException, never>,
  never,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L44)

Since v1.0.0
