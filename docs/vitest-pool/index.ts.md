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
    - [agentTemplatePath (property)](#agenttemplatepath-property)
  - [createFridaPool](#createfridapool)

---

# Tests

## FridaPoolWorker (class)

**Signature**

```ts
declare class FridaPoolWorker {
  constructor(poolOptions: VitestNode.PoolOptions, customOptions: Schema.Schema.Type<ConfigSchema>)
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L86)

Since v1.0.0

### start (method)

**Signature**

```ts
declare const start: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L132)

### stop (method)

**Signature**

```ts
declare const stop: () => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L214)

### send (method)

**Signature**

```ts
declare const send: (message: VitestNode.WorkerRequest) => Promise<void>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L220)

### on (method)

**Signature**

```ts
declare const on: (event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L235)

### off (method)

**Signature**

```ts
declare const off: (_event: string, callback: (arg: any) => void) => void
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L285)

### deserialize (method)

**Signature**

```ts
declare const deserialize: (data: unknown) => any
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L293)

### serialize (method)

**Signature**

```ts
declare const serialize: (data: unknown) => unknown
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L298)

### name (property)

**Signature**

```ts
readonly name: "frida-pool"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L87)

### agentTemplatePath (property)

**Signature**

```ts
readonly agentTemplatePath: URL
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L88)

## createFridaPool

**Signature**

```ts
declare const createFridaPool: (customOptions: Schema.Schema.Encoded<ConfigSchema>) => VitestNode.PoolRunnerInitializer
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/src/index.ts#L307)

Since v1.0.0
