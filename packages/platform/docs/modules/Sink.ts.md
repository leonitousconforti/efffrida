---
title: Sink.ts
nav_order: 5
parent: Modules
---

## Sink.ts overview

Effect `Sink` utilities for Frida.

Since v1.0.0

---

## Exports Grouped by Category

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

**See**

- https://frida.re/docs/javascript-api/#outputstream

**Signature**

```ts
declare const fromOutputStream: <E>(
  evaluate: Function.LazyArg<OutputStream>,
  onError: (error: unknown) => E,
  options?: FromWritableOptions | undefined
) => Sink.Sink<void, Uint8Array, never, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Sink.ts#L31)

Since v1.0.0

## makeUnixOutputStream

**See**

- https://frida.re/docs/javascript-api/#unixoutputstream

**Signature**

```ts
declare const makeUnixOutputStream: <E>(
  fileDescriptor: number,
  onError: (error: unknown) => E,
  options?: (UnixStreamOptions & FromWritableOptions) | undefined
) => Sink.Sink<void, Uint8Array, never, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Sink.ts#L42)

Since v1.0.0

## makeWin32OutputStream

**See**

- https://frida.re/docs/javascript-api/#win32outputstream

**Signature**

```ts
declare const makeWin32OutputStream: <E>(
  handle: NativePointerValue,
  onError: (error: unknown) => E,
  options?: (WindowsStreamOptions & FromWritableOptions) | undefined
) => Sink.Sink<void, Uint8Array, never, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Sink.ts#L53)

Since v1.0.0

## sendSink

**Signature**

```ts
declare const sendSink: () => Sink.Sink<void, string, never, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Sink.ts#L24)

Since v1.0.0

# Types

## FromWritableOptions (interface)

**Signature**

```ts
export interface FromWritableOptions {
  readonly endOnDone?: boolean | undefined
}
```

[Source](https://github.com/leonitousconforti/efffrida/packages/platform/blob/main/src/Sink.ts#L16)

Since v1.0.0
