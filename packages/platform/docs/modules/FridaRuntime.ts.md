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
  - [RunMainOptions (interface)](#runmainoptions-interface)
  - [runMain](#runmain)

---

# Runtime

## RunMainOptions (interface)

**Signature**

```ts
export interface RunMainOptions {
  readonly disableErrorReporting?: boolean | undefined
  readonly disablePrettyLogger?: boolean | undefined
  readonly teardown?: Runtime.Teardown | undefined
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/FridaRuntime.ts#L75)

Since v1.0.0

## runMain

Runs an Effect as the main program of a Frida agent, like
`NodeRuntime.runMain`. Unless disabled, the pretty logger is installed and
failures are logged. A failure is also thrown so that Frida reports it to the
host, see `RunMainOptions.teardown` to customize that.

**Signature**

```ts
declare const runMain: {
  (options?: RunMainOptions | undefined): <E, A>(effect: Effect.Effect<A, E>) => void
  <E, A>(effect: Effect.Effect<A, E>, options?: RunMainOptions | undefined): void
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/FridaRuntime.ts#L90)

Since v1.0.0
