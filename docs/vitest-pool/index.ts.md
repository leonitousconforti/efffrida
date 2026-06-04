---
title: index.ts
nav_order: 1
parent: "@efffrida/vitest-pool"
---

## index.ts overview

---

## Exports Grouped by Category

- [Schemas](#schemas)
  - [FridaSchema](#fridaschema)
- [Tests](#tests)
  - [FridaPoolWorker (class)](#fridapoolworker-class)
    - [start (method)](#start-method)
    - [stop (method)](#stop-method)
    - [send (method)](#send-method)
    - [on (method)](#on-method)
    - [off (method)](#off-method)
    - [deserialize (method)](#deserialize-method)
    - [serialize (method)](#serialize-method)
    - [name (property)](#name-property)
  - [createFridaPool](#createfridapool)

---

# Schemas

## FridaSchema

**Signature**

```ts
declare const FridaSchema: Schema.Struct<{
  readonly device: Schema.Union<
    readonly [
      Schema.Struct<{ readonly connection: Schema.Literal<"local"> }>,
      Schema.Struct<{
        readonly connection: Schema.Literal<"usb">
        readonly timeout: Schema.optional<Schema.DurationFromMillis>
      }>,
      Schema.Struct<{
        readonly address: Schema.String
        readonly connection: Schema.Literal<"remote">
        readonly token: Schema.optional<Schema.String>
        readonly origin: Schema.optional<Schema.String>
        readonly keepaliveInterval: Schema.optional<Schema.DurationFromMillis>
      }>,
      Schema.Struct<{
        readonly emulatorName: Schema.String
        readonly hidden: Schema.optional<Schema.Boolean>
        readonly adbExecutable: Schema.optional<Schema.String>
        readonly connection: Schema.Literal<"android-emulator">
        readonly fridaExecutable: Schema.optional<Schema.String>
        readonly emulatorExecutable: Schema.optional<Schema.String>
      }>
    ]
  >
  readonly attach: Schema.Union<
    readonly [
      Schema.Struct<{
        readonly pid: Schema.Number
        readonly runtime: Schema.optional<Schema.Enum<typeof ScriptRuntime>>
        readonly platform: Schema.optional<Schema.Enum<typeof JsPlatform>>
        readonly realm: Schema.optional<Schema.Enum<typeof Realm>>
      }>,
      Schema.Struct<{
        readonly spawn: Schema.NonEmptyArray<Schema.String>
        readonly preSpawn: Schema.optional<Schema.Boolean>
        readonly runtime: Schema.optional<Schema.Enum<typeof ScriptRuntime>>
        readonly platform: Schema.optional<Schema.Enum<typeof JsPlatform>>
        readonly realm: Schema.optional<Schema.Enum<typeof Realm>>
      }>,
      Schema.Struct<{
        readonly attachFrontmost: Schema.Literal<true>
        readonly frontmostScope: Schema.optional<Schema.Enum<typeof Scope>>
        readonly runtime: Schema.optional<Schema.Enum<typeof ScriptRuntime>>
        readonly platform: Schema.optional<Schema.Enum<typeof JsPlatform>>
        readonly realm: Schema.optional<Schema.Enum<typeof Realm>>
      }>
    ]
  >
}>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L31)

Since v1.0.0

# Tests

## FridaPoolWorker (class)

**Signature**

```ts
declare class FridaPoolWorker {
  constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof FridaSchema>)
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L40)

Since v1.0.0

### start (method)

**Signature**

```ts
declare const start: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L122)

### stop (method)

**Signature**

```ts
declare const stop: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L128)

### send (method)

**Signature**

```ts
declare const send: (message: VitestNode.WorkerRequest) => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L135)

### on (method)

**Signature**

```ts
declare const on: (event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L149)

### off (method)

**Signature**

```ts
declare const off: (_event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L201)

### deserialize (method)

**Signature**

```ts
declare const deserialize: (data: unknown) => any
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L209)

### serialize (method)

**Signature**

```ts
declare const serialize: (data: unknown) => unknown
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L214)

### name (property)

**Signature**

```ts
readonly name: "frida-pool"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L41)

## createFridaPool

**Signature**

```ts
declare const createFridaPool: (
  customOptions: Schema.Codec.Encoded<typeof FridaSchema>
) => VitestNode.PoolRunnerInitializer
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L223)

Since v1.0.0
