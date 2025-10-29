---
title: FridaRuntime.ts
nav_order: 2
parent: Modules
---

## FridaRuntime.ts overview

Effect `Runtime` utilities for Frida.

Since v1.0.0

---

## Exports Grouped by Category

- [Runtime](#runtime)
  - [runMain](#runmain)

---

# Runtime

## runMain

**Signature**

```ts
declare const runMain: <A, E>(
  effect: Effect.Effect<A, E, never>,
  options?:
    | {
        readonly disablePrettyLogger?: boolean | undefined
        readonly teardown?: ((exit: Exit.Exit<A, E>) => void) | undefined
      }
    | undefined
) => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/FridaRuntime.ts#L23)

Since v1.0.0
