---
title: FridaIl2cppBridge.ts
nav_order: 3
parent: Modules
---

## FridaIl2cppBridge.ts overview

FridaIl2cppBridge.ts

Since v1.0.0

---

## Exports Grouped by Category

- [utils](#utils)
  - [il2cppPerformEffect](#il2cppperformeffect)

---

# utils

## il2cppPerformEffect

Attaches the caller thread to Il2Cpp domain and executes the given block.

**Signature**

```ts
declare const il2cppPerformEffect: <X, E, R>(
  effect: Effect.Effect<X, E, R>,
  flag?: "free" | "bind" | "leak" | "main" | undefined
) => Effect.Effect<X, E, R>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/FridaIl2cppBridge.ts#L17)

Since v1.0.0
