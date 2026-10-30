---
title: MemoryAccessMonitor.ts
nav_order: 4
parent: "@efffrida/platform"
---

## MemoryAccessMonitor.ts overview

Frida `Memory Access Monitor` utilities for Effect.

Since v1.0.0

---

## Exports Grouped by Category

- [Memory Access Monitor](#memory-access-monitor)
  - [watch](#watch)

---

# Memory Access Monitor

## watch

Monitors one or more memory ranges for access, and emits on the first access
of each contained memory page. Stops monitoring when the stream is
interrupted or the stream is finished. The buffer is unbounded by default;
with a `bufferSize`, accesses that arrive while it is full are dropped, or
evict the oldest one with the `"sliding"` strategy.

**Signature**

```ts
declare const watch: (
  ranges: MemoryAccessRange | Array<MemoryAccessRange>,
  options?:
    { readonly bufferSize?: number | undefined; readonly strategy?: "sliding" | "dropping" | undefined } | undefined
) => Stream.Stream<MemoryAccessDetails, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/MemoryAccessMonitor.ts#L21)

Since v1.0.0
