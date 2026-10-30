---
title: index.ts
nav_order: 1
parent: "@efffrida/vitest-pool"
---

## index.ts overview

A vitest pool that runs test files inside a frida agent.

Since v1.0.0

---

## Exports Grouped by Category

- [Schemas](#schemas)
  - [FridaSchema](#fridaschema)
- [Tests](#tests)
  - [FridaPoolWorker (class)](#fridapoolworker-class)
    - [start (method)](#start-method)
    - [stop (method)](#stop-method)
    - [send (method)](#send-method)
    - [emitError (method)](#emiterror-method)
    - [on (method)](#on-method)
    - [off (method)](#off-method)
    - [deserialize (method)](#deserialize-method)
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
        readonly extraEmulatorArgs: Schema.optional<Schema.$Array<Schema.String>>
      }>
    ]
  >
  readonly attach: Schema.Union<
    readonly [
      Schema.Struct<{
        readonly pid: Schema.Finite
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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L38)

Since v1.0.0

# Tests

## FridaPoolWorker (class)

**Signature**

```ts
declare class FridaPoolWorker {
  constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof FridaSchema>)
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L53)

Since v1.0.0

### start (method)

**Signature**

```ts
declare const start: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L133)

### stop (method)

**Signature**

```ts
declare const stop: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L139)

### send (method)

**Signature**

```ts
declare const send: (message: VitestNode.WorkerRequest) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L146)

### emitError (method)

**Signature**

```ts
declare const emitError: (error: unknown) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L170)

### on (method)

**Signature**

```ts
declare const on: (event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L175)

### off (method)

**Signature**

```ts
declare const off: (event: string, _callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L240)

### deserialize (method)

**Signature**

```ts
declare const deserialize: (data: unknown) => any
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L244)

### name (property)

**Signature**

```ts
readonly name: "frida-pool"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L54)

## createFridaPool

**Signature**

```ts
declare const createFridaPool: (
  customOptions: Schema.Codec.Encoded<typeof FridaSchema>
) => VitestNode.PoolRunnerInitializer
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L254)

Since v1.0.0
