---
title: FridaSession.ts
nav_order: 4
parent: Modules
---

## FridaSession overview

Frida sessions

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Frida](#frida)
  - [attach](#attach)
  - [spawn](#spawn)
- [Layers](#layers)
  - [layer](#layer)
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
export declare const attach: (
  target: Frida.TargetProcess,
  options?: Frida.SessionOptions | undefined
) => Effect.Effect<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope>
```

Added in v1.0.0

## spawn

**Signature**

```ts
export declare const spawn: (
  program: string | Array<string>,
  options?: Frida.SpawnOptions | undefined
) => Effect.Effect<number, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | Scope.Scope>
```

Added in v1.0.0

# Layers

## layer

**Signature**

```ts
export declare const layer: (
  target: string,
  options?: (Frida.SpawnOptions & Frida.SessionOptions) | undefined
) => Layer.Layer<FridaSession, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice>
```

Added in v1.0.0

# Models

## FridaSession (interface)

**Signature**

```ts
export interface FridaSession {
  readonly session: Frida.Session
  readonly [FridaSessionTypeId]: typeof FridaSessionTypeId
}
```

Added in v1.0.0

# Predicates

## isFridaSession

**Signature**

```ts
export declare const isFridaSession: (u: unknown) => u is FridaSession
```

Added in v1.0.0

# Tags

## FridaSession

**Signature**

```ts
export declare const FridaSession: Context.Tag<FridaSession, FridaSession>
```

Added in v1.0.0

# Type ids

## FridaSessionTypeId

**Signature**

```ts
export declare const FridaSessionTypeId: typeof FridaSessionTypeId
```

Added in v1.0.0

## FridaSessionTypeId (type alias)

**Signature**

```ts
export type FridaSessionTypeId = typeof FridaSessionTypeId
```

Added in v1.0.0
