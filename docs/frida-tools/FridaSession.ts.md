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

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L100)

Since v1.0.0

## frontmost

**Signature**

```ts
declare const frontmost: (
  options?: Frida.FrontmostQueryOptions | undefined
) => Effect.Effect<Frida.Application, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L82)

Since v1.0.0

## spawn

**Signature**

```ts
declare const spawn: (
  program: string | ReadonlyArray<string>,
  options?: Frida.SpawnOptions | undefined
) => Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L91)

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

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L110)

Since v1.0.0

## layerFrontmost

**Signature**

```ts
declare const layerFrontmost: (
  options?: Frida.FrontmostQueryOptions | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L119)

Since v1.0.0

# Models

## FridaSession (interface)

**Signature**

```ts
export interface FridaSession {
  readonly pid: number
  readonly session: Frida.Session

  readonly [FridaSessionTypeId]: typeof FridaSessionTypeId
  readonly detached: Deferred.Deferred<
    {
      reason: Frida.SessionDetachReason
      crash: Option.Option<{
        pid: number
        processName: string
        summary: string
        report: string
        parameters: unknown
      }>
    },
    FridaSessionError.FridaSessionError
  >
  readonly resume: Effect.Effect<void, FridaSessionError.FridaSessionError, never>
  readonly detach: Effect.Effect<void, FridaSessionError.FridaSessionError, never>
  readonly enableChildGating: Effect.Effect<void, Cause.UnknownError, never>
  readonly disableChildGating: Effect.Effect<void, Cause.UnknownError, never>
  setupPeerConnection(options?: Frida.PeerOptions | undefined): Effect.Effect<void, Cause.UnknownError, never>
  joinPortal(
    address: string,
    options?: Frida.PortalOptions | undefined
  ): Effect.Effect<Frida.PortalMembership, Cause.UnknownError, never>
}
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L37)

Since v1.0.0

# Predicates

## isFridaSession

**Signature**

```ts
declare const isFridaSession: (u: unknown) => u is FridaSession
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L76)

Since v1.0.0

# Tags

## FridaSession

**Signature**

```ts
declare const FridaSession: Context.Service<FridaSession, FridaSession>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L70)

Since v1.0.0

# Type ids

## FridaSessionTypeId

**Signature**

```ts
declare const FridaSessionTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L25)

Since v1.0.0

## FridaSessionTypeId (type alias)

**Signature**

```ts
type FridaSessionTypeId = typeof FridaSessionTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L31)

Since v1.0.0
