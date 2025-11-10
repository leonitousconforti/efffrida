---
title: FridaSession.ts
nav_order: 4
parent: "@efffrida/frida-tools"
---

## FridaSession.ts overview

Frida sessions

Since v1.0.0

---

## Exports Grouped by Category

- [Frida](#frida)
  - [attach](#attach)
  - [frontmost](#frontmost)
  - [spawn](#spawn)
- [Layers](#layers)
  - [layer](#layer)
  - [layerFrontmost](#layerfrontmost)
- [Models](#models)
  - [FridaSession (interface)](#fridasession-interface)
- [Predicates](#predicates)
  - [isFridaSession](#isfridasession)
- [Tags](#tags)
  - [FridaSession](#fridasession)
- [Type ids](#type-ids)
  - [FridaSessionTypeId](#fridasessiontypeid)
  - [FridaSessionTypeId (type alias)](#fridasessiontypeid-type-alias)

---

# Frida

## attach

**Signature**

```ts
declare const attach: (
  target: Frida.TargetProcess,
  options?: Frida.SessionOptions | undefined
) => Effect.Effect<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L81)

Since v1.0.0

## frontmost

**Signature**

```ts
declare const frontmost: (
  options?: Frida.FrontmostQueryOptions | undefined
) => Effect.Effect<Frida.Application, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L63)

Since v1.0.0

## spawn

**Signature**

```ts
declare const spawn: (
  program: string | Array<string>,
  options?: Frida.SpawnOptions | undefined
) => Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L72)

Since v1.0.0

# Layers

## layer

**Signature**

```ts
declare const layer: (
  target: number | string | ReadonlyArray<string>,
  options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L91)

Since v1.0.0

## layerFrontmost

**Signature**

```ts
declare const layerFrontmost: (
  options?: Frida.FrontmostQueryOptions | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L100)

Since v1.0.0

# Models

## FridaSession (interface)

**Signature**

```ts
export interface FridaSession {
  readonly session: Frida.Session
  readonly [FridaSessionTypeId]: typeof FridaSessionTypeId
  readonly resume: Effect.Effect<void, Cause.UnknownException>
  readonly enableChildGating: Effect.Effect<void, Cause.UnknownException>
  readonly disableChildGating: Effect.Effect<void, Cause.UnknownException>
  setupPeerConnection(options?: Frida.PeerOptions | undefined): Effect.Effect<void, Cause.UnknownException>
  joinPortal(
    address: string,
    options?: Frida.PortalOptions | undefined
  ): Effect.Effect<Frida.PortalMembership, Cause.UnknownException>
}
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L34)

Since v1.0.0

# Predicates

## isFridaSession

**Signature**

```ts
declare const isFridaSession: (u: unknown) => u is FridaSession
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L57)

Since v1.0.0

# Tags

## FridaSession

**Signature**

```ts
declare const FridaSession: Context.Tag<FridaSession, FridaSession>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L51)

Since v1.0.0

# Type ids

## FridaSessionTypeId

**Signature**

```ts
declare const FridaSessionTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L22)

Since v1.0.0

## FridaSessionTypeId (type alias)

**Signature**

```ts
type FridaSessionTypeId = typeof FridaSessionTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L28)

Since v1.0.0
