---
title: Channel.ts
nav_order: 1
parent: "@efffrida/platform"
---

## Channel.ts overview

Effect `Channel` utilities for Frida.

Since v1.0.0

---

## Exports Grouped by Category

- [Channel](#channel)
  - [fromIOStream](#fromiostream)

---

# Channel

## fromIOStream

**See**

- https://frida.re/docs/javascript-api/#iostream

**Signature**

```ts
declare const fromIOStream: <E1, E2>(
  iostream: IOStream,
  onWriteError: (error: unknown) => E1,
  onReadError: (error: unknown) => E2,
  options?: (FridaStream.FromInputStreamOptions & FridaSink.FromWritableOptions) | undefined
) => Channel.Channel<Chunk.Chunk<Uint8Array>, Chunk.Chunk<Uint8Array>, E1 | E2, never, void, unknown, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Channel.ts#L19)

Since v1.0.0
