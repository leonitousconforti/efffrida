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
  - [download](#download)
  - [purchase](#purchase)
- [Device](#device)
  - [AndroidDevice](#androiddevice)

---

# API

## bulkDetails

**Signature**

```ts
declare const bulkDetails: ((
  device: AndroidDevice
) => (
  bundleIdentifier: string
) => Effect.Effect<BulkDetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>) &
  ((
    bundleIdentifier: string,
    device: AndroidDevice
  ) => Effect.Effect<BulkDetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L77)

Since v1.0.0

## delivery

**Signature**

```ts
declare const delivery: ((
  device: AndroidDevice
) => (
  bundleIdentifier: string,
  options: {
    offerType: number
    deliveryToken: string
    versionCode: number | bigint
    certificateHash?: string | undefined
  }
) => Effect.Effect<DeliveryResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>) &
  ((
    bundleIdentifier: string,
    options: {
      offerType: number
      deliveryToken: string
      versionCode: number | bigint
      certificateHash?: string | undefined
    },
    device: AndroidDevice
  ) => Effect.Effect<DeliveryResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L156)

Since v1.0.0

## details

**Signature**

```ts
declare const details: ((
  device: AndroidDevice
) => (
  bundleIdentifier: string
) => Effect.Effect<DetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>) &
  ((
    bundleIdentifier: string,
    device: AndroidDevice
  ) => Effect.Effect<DetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L48)

Since v1.0.0

## download

**Signature**

```ts
declare const download: (
  device: AndroidDevice,
  bundleIdentifier: string
) => Effect.Effect<
  readonly [
    { url: string; name: string; file: string; size: bigint; integrity: { sha1: string } | { sha256: string } },
    ...{ url: string; name: string; file: string; size: bigint; integrity: { sha1: string } | { sha256: string } }[]
  ],
  HttpClientError.HttpClientError | Schema.SchemaError | PlatformError.PlatformError,
  HttpClient.HttpClient | FileSystem.FileSystem | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L210)

Since v1.0.0

## purchase

**Signature**

```ts
declare const purchase: ((
  device: AndroidDevice
) => (
  bundleIdentifier: string,
  options: { offerType: number; versionCode: number | bigint; certificateHash?: string }
) => Effect.Effect<BuyResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>) &
  ((
    bundleIdentifier: string,
    options: { offerType: number; versionCode: number | bigint; certificateHash?: string },
    device: AndroidDevice
  ) => Effect.Effect<BuyResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>)
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L116)

Since v1.0.0

# Device

## AndroidDevice

**Signature**

```ts
declare const AndroidDevice: typeof AndroidDevice
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L41)

Since v1.0.0
