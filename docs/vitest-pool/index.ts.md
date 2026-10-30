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
  readonly device: typeof FridaDevice.DeviceSchema
  readonly attach: typeof FridaSession.AttachSchema
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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L56)

Since v1.0.0

### start (method)

**Signature**

```ts
declare const start: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L134)

### stop (method)

**Signature**

```ts
declare const stop: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L140)

### send (method)

**Signature**

```ts
declare const send: (message: VitestNode.WorkerRequest) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L147)

### emitError (method)

**Signature**

```ts
declare const emitError: (error: unknown) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L171)

### on (method)

**Signature**

```ts
declare const on: (event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L176)

### off (method)

**Signature**

```ts
declare const off: (event: string, _callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L241)

### deserialize (method)

**Signature**

```ts
declare const deserialize: (data: unknown) => any
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L245)

### name (property)

**Signature**

```ts
readonly name: "frida-pool"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L57)

## createFridaPool

**Signature**

```ts
declare const createFridaPool: (
  customOptions: Schema.Codec.Encoded<typeof FridaSchema>
) => VitestNode.PoolRunnerInitializer
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/vitest-pool/src/index.ts#L255)

Since v1.0.0
