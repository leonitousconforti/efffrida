---
title: FridaIl2cppBridge.ts
nav_order: 1
parent: "@efffrida/il2cpp-bridge"
---

## FridaIl2cppBridge overview

FridaIl2cppBridge.ts

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [il2cppPerformEffect](#il2cppperformeffect)

---

# utils

## il2cppPerformEffect

Attaches the caller thread to Il2Cpp domain and executes the given block.

**Signature**

```ts
export declare const il2cppPerformEffect: <X, E, R>(
  effect: Effect.Effect<X, E, R>,
  flag?: "free" | "bind" | "leak" | "main" | undefined
) => Effect.Effect<void, E, R>
```

Added in v1.0.0
