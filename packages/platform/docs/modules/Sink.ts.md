---
title: Sink.ts
nav_order: 5
parent: Modules
---

## Sink overview

Effect `Sink` utilities for Frida.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Constructors](#constructors)
  - [fromOutputStream](#fromoutputstream)
  - [makeUnixOutputStream](#makeunixoutputstream)
  - [makeWin32OutputStream](#makewin32outputstream)
  - [sendSink](#sendsink)
- [Types](#types)
  - [FromWritableOptions (interface)](#fromwritableoptions-interface)

---

# Constructors

## fromOutputStream

**Signature**

```ts
export declare const fromOutputStream: <E>(
  evaluate: Function.LazyArg<OutputStream>,
  onError: (error: unknown) => E,
  options?: FromWritableOptions | undefined
) => Sink.Sink<void, Uint8Array, never, E, never>
```

Added in v1.0.0

## makeUnixOutputStream

**Signature**

```ts
export declare const makeUnixOutputStream: <E>(
  fileDescriptor: number,
  onError: (error: unknown) => E,
  options?: (UnixStreamOptions & FromWritableOptions) | undefined
) => Sink.Sink<void, Uint8Array, never, E, never>
```

Added in v1.0.0

## makeWin32OutputStream

**Signature**

```ts
export declare const makeWin32OutputStream: <E>(
  handle: NativePointerValue,
  onError: (error: unknown) => E,
  options?: (WindowsStreamOptions & FromWritableOptions) | undefined
) => Sink.Sink<void, Uint8Array, never, E, never>
```

Added in v1.0.0

## sendSink

**Signature**

```ts
export declare const sendSink: () => Sink.Sink<void, string, never, never, never>
```

Added in v1.0.0

# Types

## FromWritableOptions (interface)

**Signature**

```ts
export interface FromWritableOptions {
  readonly endOnDone?: boolean | undefined
}
```

Added in v1.0.0
