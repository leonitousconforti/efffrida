---
title: AndroidDevice.ts
nav_order: 1
parent: "@efffrida/gplayapi"
---

## AndroidDevice.ts overview

Google play android device profiles.

Since v1.0.0

---

## Exports Grouped by Category

- [Constants](#constants)
  - [authHeadersTtl](#authheadersttl)
- [Constructors](#constructors)
  - [EmbeddedPixel7a](#embeddedpixel7a)
  - [fromPropertiesFile](#frompropertiesfile)
- [Layers](#layers)
  - [EmbeddedPixel7aLive](#embeddedpixel7alive)
- [Models](#models)
  - [AndroidDevice (class)](#androiddevice-class)
    - [authHeaders (property)](#authheaders-property)
- [Tags](#tags)
  - [AndroidDeviceService (class)](#androiddeviceservice-class)

---

# Constants

## authHeadersTtl

How long resolved auth headers stay usable. Google's oauth tokens live for an
hour, so re-acquiring well inside that window keeps a long lived process from
ever reaching for headers that expired underneath it.

**Signature**

```ts
declare const authHeadersTtl: Duration.Duration
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L55)

Since v1.0.0

# Constructors

## EmbeddedPixel7a

**Signature**

```ts
declare const EmbeddedPixel7a: Effect.Effect<
  AndroidDevice,
  Schema.SchemaError | PlatformError.PlatformError | PlatformError.BadArgument,
  FileSystem.FileSystem | Path.Path
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L193)

Since v1.0.0

## fromPropertiesFile

**Signature**

```ts
declare const fromPropertiesFile: (
  file: string
) => Effect.Effect<AndroidDevice, Schema.SchemaError | PlatformError.PlatformError, FileSystem.FileSystem>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L167)

Since v1.0.0

# Layers

## EmbeddedPixel7aLive

**Signature**

```ts
declare const EmbeddedPixel7aLive: Layer.Layer<
  AndroidDeviceService,
  Schema.SchemaError | PlatformError.PlatformError | PlatformError.BadArgument,
  FileSystem.FileSystem | Path.Path
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L206)

Since v1.0.0

# Models

## AndroidDevice (class)

The profile of the android device that google play requests are made as.

**Signature**

```ts
declare class AndroidDevice
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L63)

Since v1.0.0

### authHeaders (property)

**Signature**

```ts
readonly authHeaders: Effect.Effect<Record<string, string>, HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError, PlayAccount | HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L135)

Since v1.0.0

# Tags

## AndroidDeviceService (class)

**Signature**

```ts
declare class AndroidDeviceService
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L43)

Since v1.0.0
