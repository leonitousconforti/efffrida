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

Bidirectional byte channel over an `IOStream`: upstream chunks are written to
`iostream.output` and chunks read from `iostream.input` are emitted. The
channel completes once both sides are done, and the `IOStream` is closed when
the channel finishes. Unless `endOnDone` is `false`, the output side is also
closed as soon as upstream is done.

**See**

- https://frida.re/docs/javascript-api/#iostream

**Signature**

```ts
declare const fromIOStream: <E1 = Cause.UnknownError, E2 = Cause.UnknownError, IE = never>(
  options: FridaStream.FromInputStreamOptions &
    FridaSink.FromWritableOptions & {
      readonly evaluate: Function.LazyArg<IOStream>
      readonly onWriteError?: ((error: unknown) => E1) | undefined
      readonly onReadError?: ((error: unknown) => E2) | undefined
    }
) => Channel.Channel<
  Array.NonEmptyReadonlyArray<Uint8Array>,
  E1 | E2 | IE,
  void,
  Array.NonEmptyReadonlyArray<Uint8Array>,
  IE,
  unknown,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Channel.ts#L28)

Since v1.0.0
