---
title: FridaSession.ts
nav_order: 4
parent: Modules
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
  - [SessionLive](#sessionlive)
  - [layer](#layer)
  - [layerFrontmost](#layerfrontmost)
- [Models](#models)
  - [FridaSession (interface)](#fridasession-interface)
- [Predicates](#predicates)
  - [isFridaSession](#isfridasession)
- [Schemas](#schemas)
  - [AttachSchema](#attachschema)
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

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L103)

Since v1.0.0

## frontmost

**Signature**

```ts
declare const frontmost: (
  options?: Frida.FrontmostQueryOptions | undefined
) => Effect.Effect<Frida.Application, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L85)

Since v1.0.0

## spawn

**Signature**

```ts
declare const spawn: (
  program: string | ReadonlyArray<string>,
  options?: Frida.SpawnOptions | undefined
) => Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L94)

Since v1.0.0

# Layers

## SessionLive

**Signature**

```ts
declare const SessionLive: (
  config: Schema.Schema.Type<typeof AttachSchema>
) => Layer.Layer<
  FridaSession,
  FridaSessionError.FridaSessionError | PlatformError.PlatformError,
  FridaDevice.FridaDevice | ChildProcessSpawner.ChildProcessSpawner
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L159)

Since v1.0.0

## layer

**Signature**

```ts
declare const layer: (
  target: number | string | ReadonlyArray<string>,
  options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L113)

Since v1.0.0

## layerFrontmost

**Signature**

```ts
declare const layerFrontmost: (
  options?: Frida.FrontmostQueryOptions | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L122)

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

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L40)

Since v1.0.0

# Predicates

## isFridaSession

**Signature**

```ts
declare const isFridaSession: (u: unknown) => u is FridaSession
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L79)

Since v1.0.0

# Schemas

## AttachSchema

**Signature**

```ts
declare const AttachSchema: Schema.Union<
  readonly [
    Schema.Struct<{
      readonly pid: Schema.Number
      readonly runtime: Schema.optional<Schema.Enum<typeof Frida.ScriptRuntime>>
      readonly platform: Schema.optional<Schema.Enum<typeof Frida.JsPlatform>>
      readonly realm: Schema.optional<Schema.Enum<typeof Frida.Realm>>
    }>,
    Schema.Struct<{
      readonly spawn: Schema.NonEmptyArray<Schema.String>
      readonly preSpawn: Schema.optional<Schema.Boolean>
      readonly runtime: Schema.optional<Schema.Enum<typeof Frida.ScriptRuntime>>
      readonly platform: Schema.optional<Schema.Enum<typeof Frida.JsPlatform>>
      readonly realm: Schema.optional<Schema.Enum<typeof Frida.Realm>>
    }>,
    Schema.Struct<{
      readonly attachFrontmost: Schema.Literal<true>
      readonly frontmostScope: Schema.optional<Schema.Enum<typeof Frida.Scope>>
      readonly runtime: Schema.optional<Schema.Enum<typeof Frida.ScriptRuntime>>
      readonly platform: Schema.optional<Schema.Enum<typeof Frida.JsPlatform>>
      readonly realm: Schema.optional<Schema.Enum<typeof Frida.Realm>>
    }>
  ]
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L130)

Since v1.0.0

# Tags

## FridaSession

**Signature**

```ts
declare const FridaSession: Context.Service<FridaSession, FridaSession>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L73)

Since v1.0.0

# Type ids

## FridaSessionTypeId

**Signature**

```ts
declare const FridaSessionTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L28)

Since v1.0.0

## FridaSessionTypeId (type alias)

**Signature**

```ts
type FridaSessionTypeId = typeof FridaSessionTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaSession.ts#L34)

Since v1.0.0
