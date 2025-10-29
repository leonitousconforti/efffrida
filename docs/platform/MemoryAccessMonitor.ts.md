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
  - [MemoryAccessMonitorStream](#memoryaccessmonitorstream)

---

# Memory Access Monitor

## MemoryAccessMonitorStream

Starts monitoring one or more memory ranges for access, and notifies on the
first access of each contained memory page. Stops monitoring when the stream
is interrupted or the stream is finished.

**Signature**

```ts
declare const MemoryAccessMonitorStream: (
  ranges: MemoryAccessRange | Array<MemoryAccessRange>,
  options?:
    | { readonly bufferSize: "unbounded" }
    | { readonly bufferSize?: number | undefined; readonly strategy?: "dropping" | "sliding" | undefined }
    | undefined
) => Stream.Stream<MemoryAccessDetails, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/MemoryAccessMonitor.ts#L19)

Since v1.0.0
