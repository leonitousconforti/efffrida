---
title: FridaScript.ts
nav_order: 3
parent: Modules
---

## FridaScript.ts overview

Frida scripts

Since v1.0.0

---

## Exports Grouped by Category

- [Frida](#frida)
  - [compile](#compile)
  - [load](#load)
  - [logWatchErrors](#logwatcherrors)
  - [watch](#watch)
- [Layers](#layers)
  - [layer](#layer)
- [Models](#models)
  - [FridaScript (interface)](#fridascript-interface)
- [Options](#options)
  - [LoadOptions (interface)](#loadoptions-interface)
- [Predicates](#predicates)
  - [isFridaScript](#isfridascript)
- [Services](#services)
  - [FridaScript](#fridascript)
- [Type ids](#type-ids)
  - [FridaScriptTypeId](#fridascripttypeid)
  - [FridaScriptTypeId (type alias)](#fridascripttypeid-type-alias)

---

# Frida

## compile

**Signature**

```ts
declare const compile: {
  (
    entrypoint: string,
    options?: Frida.CompilerOptions | undefined
  ): Effect.Effect<string, FridaSessionError.FridaSessionError>
  (
    options?: Frida.CompilerOptions | undefined
  ): (entrypoint: string) => Effect.Effect<string, FridaSessionError.FridaSessionError>
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L108)

Since v1.0.0

## load

**Signature**

```ts
declare const load: {
  (
    entrypoint: URL | string,
    options?: LoadOptions | undefined
  ): Effect.Effect<
    FridaScript,
    FridaSessionError.FridaSessionError,
    Path.Path | FridaSession.FridaSession | Scope.Scope
  >
  (
    options?: LoadOptions | undefined
  ): (
    entrypoint: URL | string
  ) => Effect.Effect<
    FridaScript,
    FridaSessionError.FridaSessionError,
    Path.Path | FridaSession.FridaSession | Scope.Scope
  >
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L122)

Since v1.0.0

## logWatchErrors

Successes will be logged with info, failures with warning, defects with
error, and interruptions with debug.

**Signature**

```ts
declare const logWatchErrors: <A, E1, E2, R>(
  watchStream: Stream.Stream<Exit.Exit<A, E1>, E2, R>
) => Stream.Stream<Exit.Exit<A, E1>, E2, R>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L191)

Since v1.0.0

## watch

**Signature**

```ts
declare const watch: {
  <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    entrypoint: URL | string,
    options?: LoadOptions | undefined
  ): Stream.Stream<
    Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
    FridaSessionError.FridaSessionError,
    FridaSession.FridaSession | Exclude<R, FridaScript>
  >
  (
    entrypoint: URL | string,
    options?: LoadOptions | undefined
  ): <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Stream.Stream<
    Exit.Exit<A, E | FridaSessionError.FridaSessionError>,
    FridaSessionError.FridaSessionError,
    FridaSession.FridaSession | Exclude<R, FridaScript>
  >
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L162)

Since v1.0.0

# Layers

## layer

**Signature**

```ts
declare const layer: {
  (
    entrypoint: URL | string,
    options?: LoadOptions | undefined
  ): Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>
  (
    options?: LoadOptions | undefined
  ): (
    entrypoint: URL | string
  ) => Layer.Layer<FridaScript, FridaSessionError.FridaSessionError, FridaSession.FridaSession>
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L146)

Since v1.0.0

# Models

## FridaScript (interface)

**Signature**

```ts
export interface FridaScript {
  readonly script: Frida.Script
  readonly [FridaScriptTypeId]: typeof FridaScriptTypeId
  readonly destroyed: Deferred.Deferred<void, never>
  readonly scriptError: Deferred.Deferred<unknown, never>
  readonly stream: Stream.Stream<
    { message: unknown; data: Option.Option<Buffer> },
    FridaSessionError.FridaSessionError,
    never
  >
  readonly sink: Sink.Sink<
    void,
    { message: unknown; data: Option.Option<Buffer> },
    never,
    FridaSessionError.FridaSessionError,
    never
  >
  readonly callExport: <A = unknown, R = never>(
    exportName: string,
    schema?: Schema.Decoder<A, R> | undefined
  ) => (...args: Array<any>) => Effect.Effect<A, FridaSessionError.FridaSessionError | Schema.SchemaError, R>
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L43)

Since v1.0.0

# Options

## LoadOptions (interface)

**Signature**

```ts
export interface LoadOptions extends Frida.ScriptOptions, Frida.CompilerOptions {
  readonly messageQueueCapacity?:
    | {
        readonly capacity?: number | undefined
        readonly strategy?: "dropping" | "sliding" | undefined
      }
    | undefined
  readonly streamShareOptions?:
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
    | undefined
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L82)

Since v1.0.0

# Predicates

## isFridaScript

**Signature**

```ts
declare const isFridaScript: (u: unknown) => u is FridaScript
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L76)

Since v1.0.0

# Services

## FridaScript

**Signature**

```ts
declare const FridaScript: Context.Service<FridaScript, FridaScript>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L70)

Since v1.0.0

# Type ids

## FridaScriptTypeId

**Signature**

```ts
declare const FridaScriptTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L31)

Since v1.0.0

## FridaScriptTypeId (type alias)

**Signature**

```ts
type FridaScriptTypeId = typeof FridaScriptTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaScript.ts#L37)

Since v1.0.0
