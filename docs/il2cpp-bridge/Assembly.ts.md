---
title: Assembly.ts
nav_order: 1
parent: "@efffrida/il2cpp-bridge"
---

## Assembly.ts overview

Since v1.0.0

---

## Exports Grouped by Category

- [Assembly](#assembly)
  - [assembly](#assembly-1)
  - [attach](#attach)
  - [tryAssembly](#tryassembly)

---

# Assembly

## assembly

**Signature**

```ts
declare const assembly: (name: string) => Effect.Effect<Il2Cpp.Assembly, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L17)

Since v1.0.0

## attach

**Signature**

```ts
declare const attach: Effect.Effect<Il2Cpp.Thread, never, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L34)

Since v1.0.0

## tryAssembly

**Signature**

```ts
declare const tryAssembly: (name: string) => Effect.Effect<Il2Cpp.Assembly, Cause.NoSuchElementException, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Assembly.ts#L24)

Since v1.0.0
