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
- [Auth](#auth)
  - [makeHttpClient](#makehttpclient)
- [Device](#device)
  - [Device](#device-1)

---

# API

## bulkDetails

**Signature**

```ts
declare const bulkDetails: (
  bundleIdentifier: string
) => Effect.Effect<BulkDetailsResponse, HttpClientError.HttpClientError, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L55)

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
) => Effect.Effect<DeliveryResponse, HttpClientError.HttpClientError, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L97)

Since v1.0.0

## details

**Signature**

```ts
declare const details: (
  bundleIdentifier: string
) => Effect.Effect<DetailsResponse, HttpClientError.HttpClientError, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L43)

Since v1.0.0

## download

**Signature**

```ts
declare const download: (
  bundleIdentifier: string
) => Effect.Effect<void, HttpClientError.HttpClientError, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L123)

Since v1.0.0

## purchase

**Signature**

```ts
declare const purchase: (
  bundleIdentifier: string,
  options: { offerType: number; versionCode: number | bigint; certificateHash?: string | undefined }
) => Effect.Effect<BuyResponse, HttpClientError.HttpClientError, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L73)

Since v1.0.0

# Auth

## makeHttpClient

**Signature**

```ts
declare const makeHttpClient: (
  device: Device
) => Layer<HttpClient.HttpClient, HttpClientError.HttpClientError | ParseError, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L28)

Since v1.0.0

# Device

## Device

**Signature**

```ts
declare const Device: typeof Device
```

[Source](https://github.com/leonitousconforti/efffrida/packages/gplayapi/blob/main/src/GooglePlayApi.ts#L36)

Since v1.0.0
