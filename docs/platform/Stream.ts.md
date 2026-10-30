---
title: Stream.ts
nav_order: 7
parent: "@efffrida/platform"
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
- [Types](#types)
  - [FromInputStreamOptions (interface)](#frominputstreamoptions-interface)

---

# Constructors

## fromInputStream

Reads from a Frida `InputStream`, which is closed when the stream finishes.
Errors are mapped with `onError`, defaulting to `Cause.UnknownError`.

**See**

- https://frida.re/docs/javascript-api/#inputstream

**Signature**

```ts
declare const fromInputStream: <E = Cause.UnknownError>(
  options: FromInputStreamOptions & {
    readonly evaluate: Function.LazyArg<InputStream>
    readonly onError?: ((error: unknown) => E) | undefined
  }
) => Stream.Stream<Uint8Array, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L63)

Since v1.0.0

## makeUnixInputStream

**See**

- https://frida.re/docs/javascript-api/#unixinputstream

**Signature**

```ts
declare const makeUnixInputStream: <E = Cause.UnknownError>(
  options: FromInputStreamOptions &
    UnixStreamOptions & { readonly fileDescriptor: number; readonly onError?: ((error: unknown) => E) | undefined }
) => Stream.Stream<Uint8Array, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L75)

Since v1.0.0

## makeWin32InputStream

**See**

- https://frida.re/docs/javascript-api/#win32inputstream

**Signature**

```ts
declare const makeWin32InputStream: <E = Cause.UnknownError>(
  options: FromInputStreamOptions &
    WindowsStreamOptions & {
      readonly handle: NativePointerValue
      readonly onError?: ((error: unknown) => E) | undefined
    }
) => Stream.Stream<Uint8Array, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L88)

Since v1.0.0

# Destructors

## toInputStream

**See**

- https://frida.re/docs/javascript-api/#inputstream

**Signature**

```ts
declare const toInputStream: <E, R>(stream: Stream.Stream<Uint8Array, E, R>) => Effect.Effect<InputStream, never, R>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L101)

Since v1.0.0

## toInputStreamNever

Like `toInputStream` but with `R` fixed to `never`.

**Signature**

```ts
declare const toInputStreamNever: <E>(stream: Stream.Stream<Uint8Array, E, never>) => InputStream
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L110)

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
        readonly idleTimeToLive?: Duration.Input | undefined
      }
    | {
        readonly capacity: number
        readonly strategy?: "sliding" | "dropping" | "suspend" | undefined
        readonly replay?: number | undefined
        readonly idleTimeToLive?: Duration.Input | undefined
      }
) => Effect.Effect<Stream.Stream<{ message: string; data?: Uint8Array | undefined }, never, never>, never, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L29)

Since v1.0.0

# Types

## FromInputStreamOptions (interface)

**Signature**

```ts
export interface FromInputStreamOptions {
  /** Size passed to each `InputStream.read` call, defaults to 64 KiB. */
  readonly chunkSize?: number | undefined
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Stream.ts#L20)

Since v1.0.0
