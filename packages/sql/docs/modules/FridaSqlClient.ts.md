---
title: FridaSqlClient.ts
nav_order: 1
parent: Modules
---

## FridaSqlClient.ts overview

Frida sql client for effect-ts.

Since v1.0.0

---

## Exports Grouped by Category

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
declare const make: (
  options: SqliteClientConfig
) => Effect.Effect<SqliteClient, never, Scope.Scope | Reactivity.Reactivity>
```

[Source](/blob/main/src/FridaSqlClient.ts#L94)

Since v1.0.0

# Layers

## layer

**Signature**

```ts
declare const layer: (config: SqliteClientConfig) => Layer.Layer<SqliteClient | SqlClient.SqlClient, ConfigError>
```

[Source](/blob/main/src/FridaSqlClient.ts#L250)

Since v1.0.0

## layerConfig

**Signature**

```ts
declare const layerConfig: (
  config: Config.Config.Wrap<SqliteClientConfig>
) => Layer.Layer<SqliteClient | SqlClient.SqlClient, ConfigError>
```

[Source](/blob/main/src/FridaSqlClient.ts#L236)

Since v1.0.0

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

[Source](/blob/main/src/FridaSqlClient.ts#L42)

Since v1.0.0

## SqliteClientConfig (type alias)

**Signature**

```ts
type SqliteClientConfig = (
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

[Source](/blob/main/src/FridaSqlClient.ts#L69)

Since v1.0.0

# Tags

## SqliteClient

**Signature**

```ts
declare const SqliteClient: Context.Tag<SqliteClient, SqliteClient>
```

[Source](/blob/main/src/FridaSqlClient.ts#L63)

Since v1.0.0

# Type ids

## TypeId

**Signature**

```ts
declare const TypeId: unique symbol
```

[Source](/blob/main/src/FridaSqlClient.ts#L30)

Since v1.0.0

## TypeId (type alias)

**Signature**

```ts
type TypeId = typeof TypeId
```

[Source](/blob/main/src/FridaSqlClient.ts#L36)

Since v1.0.0
