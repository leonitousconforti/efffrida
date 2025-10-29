---
title: Stream.ts
nav_order: 7
parent: Modules
---

## Stream.ts overview

Effect `Stream` utilities for Frida.

Since v1.0.0

---

## Exports Grouped by Category

- [Constructors](#constructors)
  - [fromInputStream](#frominputstream)
  - [makeUnixInputStream](#makeunixinputstream)
  - [makeWin32InputStream](#makewin32inputstream)
- [Destructors](#destructors)
  - [toInputStream](#toinputstream)
  - [toInputStreamNever](#toinputstreamnever)
- [IPC](#ipc)
  - [receiveStream](#receivestream)
- [Transformations](#transformations)
  - [decodeText](#decodetext)
  - [encodeText](#encodetext)
- [Types](#types)
  - [FromInputStreamOptions (interface)](#frominputstreamoptions-interface)

---

# Constructors

## fromInputStream

**See**

- https://frida.re/docs/javascript-api/#inputstream

**Signature**

```ts
declare const fromInputStream: <E>(
  evaluate: Function.LazyArg<InputStream>,
  onError: (error: unknown) => E,
  options?: FromInputStreamOptions | undefined
) => Stream.Stream<Uint8Array, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L59)

Since v1.0.0

## makeUnixInputStream

**See**

- https://frida.re/docs/javascript-api/#unixinputstream

**Signature**

```ts
declare const makeUnixInputStream: <E>(
  fileDescriptor: number,
  onError: (error: unknown) => E,
  options?: (FromInputStreamOptions & UnixStreamOptions) | undefined
) => Stream.Stream<Uint8Array, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L70)

Since v1.0.0

## makeWin32InputStream

**See**

- https://frida.re/docs/javascript-api/#win32inputstream

**Signature**

```ts
declare const makeWin32InputStream: <E>(
  handle: NativePointerValue,
  onError: (error: unknown) => E,
  options?: (FromInputStreamOptions & WindowsStreamOptions) | undefined
) => Stream.Stream<Uint8Array, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L81)

Since v1.0.0

# Destructors

## toInputStream

**See**

- https://frida.re/docs/javascript-api/#inputstream

**Signature**

```ts
declare const toInputStream: <E, R>(stream: Stream.Stream<Uint8Array, E, R>) => Effect.Effect<InputStream, never, R>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L92)

Since v1.0.0

## toInputStreamNever

Like `toInputStream` but with `R` fixed to `never`.

**Signature**

```ts
declare const toInputStreamNever: <E>(stream: Stream.Stream<Uint8Array, E, never>) => InputStream
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L101)

Since v1.0.0

# IPC

## receiveStream

**Signature**

```ts
declare const receiveStream: (
  shareOptions:
    | {
        readonly capacity: "unbounded"
        readonly replay?: number | undefined
        readonly idleTimeToLive?: Duration.DurationInput | undefined
      }
    | {
        readonly capacity: number
        readonly strategy?: "sliding" | "dropping" | "suspend" | undefined
        readonly replay?: number | undefined
        readonly idleTimeToLive?: Duration.DurationInput | undefined
      }
) => Effect.Effect<Stream.Stream<{ message: string; data?: Uint8Array | undefined }, never, never>, never, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L28)

Since v1.0.0

# Transformations

## decodeText

**Signature**

```ts
declare const decodeText: {
  (encoding?: BufferEncoding | undefined): <E, R>(self: Stream.Stream<Uint8Array, E, R>) => Stream.Stream<string, E, R>
  <E, R>(self: Stream.Stream<Uint8Array, E, R>, encoding?: BufferEncoding | undefined): Stream.Stream<string, E, R>
}
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L119)

Since v1.0.0

## encodeText

**Signature**

```ts
declare const encodeText: {
  (encoding?: BufferEncoding | undefined): <E, R>(self: Stream.Stream<string, E, R>) => Stream.Stream<Uint8Array, E, R>
  <E, R>(self: Stream.Stream<string, E, R>, encoding?: BufferEncoding | undefined): Stream.Stream<Uint8Array, E, R>
}
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L108)

Since v1.0.0

# Types

## FromInputStreamOptions (interface)

**Signature**

```ts
export interface FromInputStreamOptions {
  readonly chunkSize?: FileSystem.SizeInput | undefined
}
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Stream.ts#L20)

Since v1.0.0
