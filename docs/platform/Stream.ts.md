---
title: Stream.ts
nav_order: 7
parent: "@efffrida/platform"
---

## Stream overview

Effect `Stream` utilities for Frida.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

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

**Signature**

```ts
export declare const fromInputStream: <E>(
  evaluate: Function.LazyArg<InputStream>,
  onError: (error: unknown) => E,
  options?: FromInputStreamOptions | undefined
) => Stream.Stream<Uint8Array, E, never>
```

Added in v1.0.0

## makeUnixInputStream

**Signature**

```ts
export declare const makeUnixInputStream: <E>(
  fileDescriptor: number,
  onError: (error: unknown) => E,
  options?: (FromInputStreamOptions & UnixStreamOptions) | undefined
) => Stream.Stream<Uint8Array, E, never>
```

Added in v1.0.0

## makeWin32InputStream

**Signature**

```ts
export declare const makeWin32InputStream: <E>(
  handle: NativePointerValue,
  onError: (error: unknown) => E,
  options?: (FromInputStreamOptions & WindowsStreamOptions) | undefined
) => Stream.Stream<Uint8Array, E, never>
```

Added in v1.0.0

# Destructors

## toInputStream

**Signature**

```ts
export declare const toInputStream: <E, R>(
  stream: Stream.Stream<Uint8Array, E, R>
) => Effect.Effect<InputStream, never, R>
```

Added in v1.0.0

## toInputStreamNever

Like {@link toInputStream} but with `R` fixed to `never`.

**Signature**

```ts
export declare const toInputStreamNever: <E>(stream: Stream.Stream<Uint8Array, E, never>) => InputStream
```

Added in v1.0.0

# IPC

## receiveStream

**Signature**

```ts
export declare const receiveStream: () => Stream.Stream<
  { message: string; data?: Uint8Array | undefined },
  never,
  never
>
```

Added in v1.0.0

# Transformations

## decodeText

**Signature**

```ts
export declare const decodeText: {
  (encoding?: BufferEncoding | undefined): <E, R>(self: Stream.Stream<Uint8Array, E, R>) => Stream.Stream<string, E, R>
  <E, R>(self: Stream.Stream<Uint8Array, E, R>, encoding?: BufferEncoding | undefined): Stream.Stream<string, E, R>
}
```

Added in v1.0.0

## encodeText

**Signature**

```ts
export declare const encodeText: {
  (encoding?: BufferEncoding | undefined): <E, R>(self: Stream.Stream<string, E, R>) => Stream.Stream<Uint8Array, E, R>
  <E, R>(self: Stream.Stream<string, E, R>, encoding?: BufferEncoding | undefined): Stream.Stream<Uint8Array, E, R>
}
```

Added in v1.0.0

# Types

## FromInputStreamOptions (interface)

**Signature**

```ts
export interface FromInputStreamOptions {
  readonly chunkSize?: FileSystem.SizeInput | undefined
}
```

Added in v1.0.0
