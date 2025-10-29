---
title: index.ts
nav_order: 1
parent: Modules
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
    - [name (property)](#name-property)
  - [createFridaPool](#createfridapool)

---

# Tests

## FridaPoolWorker (class)

**Signature**

```ts
declare class FridaPoolWorker {
  constructor(_poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<typeof ConfigSchema>)
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L63)

Since v1.0.0

### start (method)

**Signature**

```ts
declare const start: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L127)

### stop (method)

**Signature**

```ts
declare const stop: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L133)

### send (method)

**Signature**

```ts
declare const send: (message: WorkerRequest) => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L137)

### on (method)

**Signature**

```ts
declare const on: (event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L145)

### off (method)

**Signature**

```ts
declare const off: (_event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L185)

### deserialize (method)

**Signature**

```ts
declare const deserialize: (data: unknown) => unknown
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L193)

### name (property)

**Signature**

```ts
readonly name: "frida-pool"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L64)

## createFridaPool

**Signature**

```ts
declare const createFridaPool: (
  customOptions: Schema.Schema.Encoded<typeof ConfigSchema>
) => VitestNode.PoolRunnerInitializer
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L202)

Since v1.0.0
