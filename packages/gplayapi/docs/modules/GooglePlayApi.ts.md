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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L125)

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L176)

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L109)

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L326)

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L215)

Since v1.0.0

## purchase

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

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/GooglePlayApi.ts#L147)

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
