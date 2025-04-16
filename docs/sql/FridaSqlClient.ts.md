---
title: FridaSqlClient.ts
nav_order: 1
parent: "@efffrida/sql"
---

## FridaSqlClient overview

Frida sql client for effect-ts.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [make](#make)
- [Layers](#layers)
  - [layer](#layer)
  - [layerConfig](#layerconfig)
- [Models](#models)
  - [SqliteClient (interface)](#sqliteclient-interface)
  - [SqliteClientConfig (type alias)](#sqliteclientconfig-type-alias)
- [Tags](#tags)
  - [SqliteClient](#sqliteclient)
- [Type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# Constructor

## make

**Signature**

```ts
export declare const make: (
  options: SqliteClientConfig
) => Effect.Effect<SqliteClient, never, Scope.Scope | Reactivity.Reactivity>
```

Added in v1.0.0

# Layers

## layer

**Signature**

```ts
export declare const layer: (config: SqliteClientConfig) => Layer.Layer<SqliteClient | SqlClient.SqlClient, ConfigError>
```

Added in v1.0.0

## layerConfig

**Signature**

```ts
export declare const layerConfig: (
  config: Config.Config.Wrap<SqliteClientConfig>
) => Layer.Layer<SqliteClient | SqlClient.SqlClient, ConfigError>
```

Added in v1.0.0

# Models

## SqliteClient (interface)

**Signature**

```ts
export interface SqliteClient extends SqlClient.SqlClient {
  readonly [TypeId]: TypeId
  readonly config: SqliteClientConfig

  /**
   * Dump the database to a gzip-compressed blob encoded as Base64, where the
   * result is returned as a string. This is useful for inlining a cache in
   * your agent’s code, loaded by calling SqliteDatabase.openInline().
   */
  readonly dump: Effect.Effect<string, SqlError.SqlError>

  /** Not supported in frida */
  readonly backup: never
  readonly updateValues: never
  readonly loadExtension: never
}
```

Added in v1.0.0

## SqliteClientConfig (type alias)

**Signature**

```ts
export type SqliteClientConfig = (
  | { readonly inlineData: string }
  | { readonly filename: string; readonly openFlags?: Array<SqliteOpenFlag> | undefined }
) & {
  readonly disableWAL?: boolean | undefined
  readonly prepareCacheSize?: number | undefined
  readonly prepareCacheTTL?: Duration.DurationInput | undefined
  readonly spanAttributes?: Record<string, unknown> | undefined
  readonly transformQueryNames?: ((str: string) => string) | undefined
  readonly transformResultNames?: ((str: string) => string) | undefined
}
```

Added in v1.0.0

# Tags

## SqliteClient

**Signature**

```ts
export declare const SqliteClient: Context.Tag<SqliteClient, SqliteClient>
```

Added in v1.0.0

# Type ids

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0
