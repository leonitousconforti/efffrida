---
title: GooglePlayApi.ts
nav_order: 1
parent: Modules
---

## GooglePlayApi.ts overview

Unofficial Google Play Store API for downloading APKs directly from Google
Play Store.

Since v1.0.0

---

## Exports Grouped by Category

- [API](#api)
  - [bulkDetails](#bulkdetails)
  - [delivery](#delivery)
  - [details](#details)
  - [downloadToDisk](#downloadtodisk)
  - [downloadToStreams](#downloadtostreams)
  - [purchase](#purchase)
- [Device](#device)
  - [AndroidDevice](#androiddevice)
  - [AndroidDeviceService](#androiddeviceservice)

---

# API

## bulkDetails

**Signature**

```ts
declare const bulkDetails: (
  bundleIdentifier: string
) => Effect.Effect<
  BulkDetailsResponse,
  HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L134)

Since v1.0.0

## delivery

**Signature**

```ts
declare const delivery: (
  bundleIdentifier: string,
  options: {
    offerType: number
    deliveryToken: string
    versionCode: number | bigint
    certificateHash?: string | undefined
  }
) => Effect.Effect<
  DeliveryResponse,
  HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L196)

Since v1.0.0

## details

**Signature**

```ts
declare const details: (
  bundleIdentifier: string
) => Effect.Effect<
  DetailsResponse,
  HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L107)

Since v1.0.0

## downloadToDisk

**Signature**

```ts
declare const downloadToDisk: (
  bundleIdentifier: string,
  options?: { offerType?: number | undefined; versionCode?: number | bigint | undefined } | undefined
) => Effect.Effect<
  readonly [
    {
      url: string
      name: string
      file: string
      size: bigint
      integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string }
    },
    ...{
      url: string
      name: string
      file: string
      size: bigint
      integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string }
    }[]
  ],
  | HttpClientError.HttpClientError
  | Schema.SchemaError
  | PlayAccountError
  | Cause.NoSuchElementError
  | PlatformError.PlatformError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService | Crypto.Crypto | FileSystem.FileSystem | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L340)

Since v1.0.0

## downloadToStreams

**Signature**

```ts
declare const downloadToStreams: (
  bundleIdentifier: string,
  options?: { offerType?: number | undefined; versionCode?: number | bigint | undefined } | undefined
) => Effect.Effect<
  readonly [
    {
      stream: Stream.Stream<Uint8Array, HttpClientError.HttpClientError, never>
      integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string }
      size: bigint
      name: string
      url: string
    },
    ...{
      stream: Stream.Stream<Uint8Array, HttpClientError.HttpClientError, never>
      integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string }
      size: bigint
      name: string
      url: string
    }[]
  ],
  HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError | Cause.NoSuchElementError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L235)

Since v1.0.0

## purchase

**Signature**

```ts
declare const purchase: (
  bundleIdentifier: string,
  options: { offerType: number; versionCode: number | bigint; certificateHash?: string }
) => Effect.Effect<
  BuyResponse,
  HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L163)

Since v1.0.0

# Device

## AndroidDevice

**Signature**

```ts
declare const AndroidDevice: typeof AndroidDevice
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L94)

Since v1.0.0

## AndroidDeviceService

**Signature**

```ts
declare const AndroidDeviceService: typeof AndroidDeviceService
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L100)

Since v1.0.0
