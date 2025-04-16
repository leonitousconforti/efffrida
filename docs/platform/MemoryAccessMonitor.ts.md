---
title: MemoryAccessMonitor.ts
nav_order: 4
parent: "@efffrida/platform"
---

## MemoryAccessMonitor overview

Frida `Memory Access Monitor` utilities for Effect.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

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
export declare const MemoryAccessMonitorStream: (
  ranges: MemoryAccessRange | Array<MemoryAccessRange>,
  options?:
    | { readonly bufferSize: "unbounded" }
    | { readonly bufferSize?: number | undefined; readonly strategy?: "dropping" | "sliding" | undefined }
    | undefined
) => Stream.Stream<MemoryAccessDetails, never, never>
```

Added in v1.0.0
