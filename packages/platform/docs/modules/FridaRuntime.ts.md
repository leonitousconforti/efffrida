---
title: FridaRuntime.ts
nav_order: 2
parent: Modules
---

## FridaRuntime overview

Effect `Runtime` utilities for Frida.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Runtime](#runtime)
  - [runMain](#runmain)

---

# Runtime

## runMain

**Signature**

```ts
export declare const runMain: <A, E>(
  effect: Effect.Effect<A, E, never>,
  options?:
    | {
        readonly disablePrettyLogger?: boolean | undefined
        readonly teardown?: ((exit: Exit.Exit<A, E>) => void) | undefined
      }
    | undefined
) => void
```

Added in v1.0.0
