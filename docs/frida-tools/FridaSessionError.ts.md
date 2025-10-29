---
title: FridaSessionError.ts
nav_order: 5
parent: "@efffrida/frida-tools"
---

## FridaSessionError.ts overview

Frida session errors

Since v1.0.0

---

## Exports Grouped by Category

- [Errors](#errors)
  - [FridaSessionError (class)](#fridasessionerror-class)
  - [FridaSessionErrorTypeId](#fridasessionerrortypeid)
  - [FridaSessionErrorTypeId (type alias)](#fridasessionerrortypeid-type-alias)
  - [isFridaSessionError](#isfridasessionerror)

---

# Errors

## FridaSessionError (class)

**Signature**

```ts
declare class FridaSessionError
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSessionError.ts#L35)

Since v1.0.0

## FridaSessionErrorTypeId

**Signature**

```ts
declare const FridaSessionErrorTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSessionError.ts#L14)

Since v1.0.0

## FridaSessionErrorTypeId (type alias)

**Signature**

```ts
type FridaSessionErrorTypeId = typeof FridaSessionErrorTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSessionError.ts#L22)

Since v1.0.0

## isFridaSessionError

**Signature**

```ts
declare const isFridaSessionError: (u: unknown) => u is FridaSessionError
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSessionError.ts#L28)

Since v1.0.0
