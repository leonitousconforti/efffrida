---
title: GooglePlayApi.ts
nav_order: 2
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
- [Models](#models)
  - [Integrity (type alias)](#integrity-type-alias)

---

# API

## bulkDetails

Fetches the details of an app through the bulk details endpoint.

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L132)

Since v1.0.0

## delivery

Fetches the download urls and digests of an app's APK, splits and OBBs.

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L187)

Since v1.0.0

## details

Fetches the store listing details of an app.

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L114)

Since v1.0.0

## downloadToDisk

Downloads the APK, its splits, and its expansion files into temporary files
and checks each against its expected integrity. Files are hashed as they are
streamed to disk, so they are never held in memory in full.

The temporary files are created with `FileSystem.makeTempFileScoped`, so they
are deleted when the provided `Scope` closes. Copy or move them somewhere
else first if they need to outlive it. A file that fails its integrity check
fails the effect, and any files written so far are removed along with the
scope.

**Signature**

```ts
declare const downloadToDisk: (
  bundleIdentifier: string,
  options?: { offerType?: number | undefined; versionCode?: number | bigint | undefined } | undefined
) => Effect.Effect<
  readonly [
    { url: string; name: string; file: string; size: bigint; integrity: Integrity },
    ...{ url: string; name: string; file: string; size: bigint; integrity: Integrity }[]
  ],
  | HttpClientError.HttpClientError
  | Schema.SchemaError
  | PlayAccountError
  | Cause.NoSuchElementError
  | EncodingError.EncodingError
  | PlatformError.PlatformError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService | FileSystem.FileSystem | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L339)

Since v1.0.0

## downloadToStreams

Purchases and delivers an app, returning a lazy stream per file to download.

**Signature**

```ts
declare const downloadToStreams: (
  bundleIdentifier: string,
  options?: { offerType?: number | undefined; versionCode?: number | bigint | undefined } | undefined
) => Effect.Effect<
  readonly [
    {
      stream: Stream.Stream<Uint8Array, HttpClientError.HttpClientError, never>
      integrity: Integrity
      size: bigint
      name: string
      url: string
    },
    ...{
      stream: Stream.Stream<Uint8Array, HttpClientError.HttpClientError, never>
      integrity: Integrity
      size: bigint
      name: string
      url: string
    }[]
  ],
  | HttpClientError.HttpClientError
  | Schema.SchemaError
  | PlayAccountError
  | Cause.NoSuchElementError
  | EncodingError.EncodingError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L228)

Since v1.0.0

## purchase

Acquires an app for the account, returning the token that `delivery` needs.

**Signature**

```ts
declare const purchase: (
  bundleIdentifier: string,
  options: { offerType: number; versionCode: number | bigint; certificateHash?: string | undefined }
) => Effect.Effect<
  BuyResponse,
  HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
  PlayAccount | HttpClient.HttpClient | AndroidDeviceService
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L156)

Since v1.0.0

# Models

## Integrity (type alias)

The expected digest of a file as lowercase hex. Expansion files are hashed
with SHA-1 and everything else with SHA-256.

**Signature**

```ts
type Integrity = { readonly "SHA-1": string } | { readonly "SHA-256": string }
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L45)

Since v1.0.0
