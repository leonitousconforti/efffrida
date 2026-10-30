---
title: AndroidDevice.ts
nav_order: 1
parent: Modules
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
  - [layerEmbeddedPixel7a](#layerembeddedpixel7a)
- [Models](#models)
  - [AndroidDevice (class)](#androiddevice-class)
    - [authHeaders (property)](#authheaders-property)
- [Services](#services)
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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L56)

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L204)

Since v1.0.0

## fromPropertiesFile

**Signature**

```ts
declare const fromPropertiesFile: (
  file: string
) => Effect.Effect<AndroidDevice, Schema.SchemaError | PlatformError.PlatformError, FileSystem.FileSystem>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L173)

Since v1.0.0

# Layers

## layerEmbeddedPixel7a

**Signature**

```ts
declare const layerEmbeddedPixel7a: Layer.Layer<
  AndroidDeviceService,
  Schema.SchemaError | PlatformError.PlatformError | PlatformError.BadArgument,
  FileSystem.FileSystem | Path.Path
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L217)

Since v1.0.0

# Models

## AndroidDevice (class)

The profile of the android device that google play requests are made as.

**Signature**

```ts
declare class AndroidDevice
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L64)

Since v1.0.0

### authHeaders (property)

Auth headers derived from this device and the provided account, cached
for `authHeadersTtl`. Failed acquisitions are not cached.

**Signature**

```ts
readonly authHeaders: Effect.Effect<Record<string, string>, HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError, PlayAccount | HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L146)

Since v1.0.0

# Services

## AndroidDeviceService (class)

**Signature**

```ts
declare class AndroidDeviceService
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/AndroidDevice.ts#L44)

Since v1.0.0
