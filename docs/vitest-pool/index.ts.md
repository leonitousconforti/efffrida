---
title: index.ts
nav_order: 1
parent: "@efffrida/vitest-pool"
---

## index.ts overview

---

## Exports Grouped by Category

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

# Tests

## FridaPoolWorker (class)

**Signature**

```ts
declare class FridaPoolWorker {
  constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof ConfigSchema>)
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L81)

Since v1.0.0

### start (method)

**Signature**

```ts
declare const start: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L227)

### stop (method)

**Signature**

```ts
declare const stop: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L231)

### send (method)

**Signature**

```ts
declare const send: (message: VitestNode.WorkerRequest) => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L238)

### on (method)

**Signature**

```ts
declare const on: (event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L253)

### off (method)

**Signature**

```ts
declare const off: (_event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L315)

### deserialize (method)

**Signature**

```ts
declare const deserialize: (data: unknown) => any
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L323)

### serialize (method)

**Signature**

```ts
declare const serialize: (data: unknown) => unknown
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L328)

### name (property)

**Signature**

```ts
readonly name: "frida-pool"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L82)

## createFridaPool

**Signature**

```ts
declare const createFridaPool: (
  customOptions: Schema.Codec.Encoded<typeof ConfigSchema>
) => VitestNode.PoolRunnerInitializer
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L337)

Since v1.0.0
