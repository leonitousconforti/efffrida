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

Writes to a Frida `OutputStream`. Errors are mapped with `onError`,
defaulting to `Cause.UnknownError`.

**See**

- https://frida.re/docs/javascript-api/#outputstream

**Signature**

```ts
declare const fromOutputStream: <E = Cause.UnknownError>(
  options: FromWritableOptions & {
    readonly evaluate: Function.LazyArg<OutputStream>
    readonly onError?: ((error: unknown) => E) | undefined
  }
) => Sink.Sink<void, Uint8Array, never, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Sink.ts#L39)

Since v1.0.0

## makeUnixOutputStream

**See**

- https://frida.re/docs/javascript-api/#unixoutputstream

**Signature**

```ts
declare const makeUnixOutputStream: <E = Cause.UnknownError>(
  options: FromWritableOptions &
    UnixStreamOptions & { readonly fileDescriptor: number; readonly onError?: ((error: unknown) => E) | undefined }
) => Sink.Sink<void, Uint8Array, never, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Sink.ts#L51)

Since v1.0.0

## makeWin32OutputStream

**See**

- https://frida.re/docs/javascript-api/#win32outputstream

**Signature**

```ts
declare const makeWin32OutputStream: <E = Cause.UnknownError>(
  options: FromWritableOptions &
    WindowsStreamOptions & {
      readonly handle: NativePointerValue
      readonly onError?: ((error: unknown) => E) | undefined
    }
) => Sink.Sink<void, Uint8Array, never, E, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Sink.ts#L64)

Since v1.0.0

## sendSink

Sends each string to the host with Frida's `send`.

**Signature**

```ts
declare const sendSink: Sink.Sink<void, string, never, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Sink.ts#L29)

Since v1.0.0

# Types

## FromWritableOptions (interface)

**Signature**

```ts
export interface FromWritableOptions {
  /** Whether to close the `OutputStream` when the sink is done, defaults to
   * `true`. */
  readonly endOnDone?: boolean | undefined
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/platform/src/Sink.ts#L17)

Since v1.0.0
