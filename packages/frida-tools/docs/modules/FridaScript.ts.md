---
title: FridaScript.ts
nav_order: 3
parent: Modules
---

## FridaScript overview

Frida scripts

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Frida](#frida)
  - [load](#load)
- [Layers](#layers)
  - [layer](#layer)
- [Models](#models)
  - [FridaScript (interface)](#fridascript-interface)
- [Predicates](#predicates)
  - [isFridaScript](#isfridascript)
- [Tags](#tags)
  - [FridaScript](#fridascript)
- [Type ids](#type-ids)
  - [FridaScriptTypeId](#fridascripttypeid)
  - [FridaScriptTypeId (type alias)](#fridascripttypeid-type-alias)

---

# Frida

## load

**Signature**

```ts
export declare const load: {
  (
    source: string | Buffer,
    options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
  ): Effect.Effect<
    FridaScript,
    FridaSessionError.FridaSessionError,
    FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
  >
  (
    options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
  ): (
    source: string | Buffer
  ) => Effect.Effect<
    FridaScript,
    FridaSessionError.FridaSessionError,
    FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
  >
}
```

Added in v1.0.0

# Layers

## layer

**Signature**

```ts
export declare const layer: {
  (
    source: string | Buffer,
    options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
  ): Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaDevice.FridaDevice | FridaSession.FridaSession>
  (
    options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
  ): (
    source: string | Buffer
  ) => Layer.Layer<
    FridaScript,
    FridaSessionError.FridaSessionError,
    FridaDevice.FridaDevice | FridaSession.FridaSession
  >
}
```

Added in v1.0.0

# Models

## FridaScript (interface)

**Signature**

```ts
export interface FridaScript {
  readonly script: Frida.Script
  readonly destroyed: Deferred.Deferred<void, never>
  readonly [FridaScriptTypeId]: typeof FridaScriptTypeId
  readonly stream: Stream.Stream<
    { message: any; data: Option.Option<Buffer> },
    FridaSessionError.FridaSessionError,
    never
  >
  readonly sink: Sink.Sink<
    void,
    { message: any; data: Option.Option<Buffer> },
    never,
    FridaSessionError.FridaSessionError,
    never
  >
  readonly callExport: (
    exportName: string
  ) => (...args: Array<any>) => Effect.Effect<unknown, FridaSessionError.FridaSessionError, never>
}
```

Added in v1.0.0

# Predicates

## isFridaScript

**Signature**

```ts
export declare const isFridaScript: (u: unknown) => u is FridaScript
```

Added in v1.0.0

# Tags

## FridaScript

**Signature**

```ts
export declare const FridaScript: Context.Tag<FridaScript, FridaScript>
```

Added in v1.0.0

# Type ids

## FridaScriptTypeId

**Signature**

```ts
export declare const FridaScriptTypeId: typeof FridaScriptTypeId
```

Added in v1.0.0

## FridaScriptTypeId (type alias)

**Signature**

```ts
export type FridaScriptTypeId = typeof FridaScriptTypeId
```

Added in v1.0.0
