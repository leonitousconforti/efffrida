---
title: Channel.ts
nav_order: 1
parent: Modules
---

## Channel overview

Effect `Channel` utilities for Frida.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Channel](#channel)
  - [fromIOStream](#fromiostream)

---

# Channel

## fromIOStream

**Signature**

```ts
export declare const fromIOStream: <E1, E2>(
  iostream: IOStream,
  onWriteError: (error: unknown) => E1,
  onReadError: (error: unknown) => E2,
  options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
) => Channel.Channel<Chunk.Chunk<Uint8Array>, Chunk.Chunk<Uint8Array>, E1 | E2, never, void, unknown, never>
```

Added in v1.0.0
