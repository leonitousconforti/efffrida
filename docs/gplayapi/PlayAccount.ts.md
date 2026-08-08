---
title: PlayAccount.ts
nav_order: 4
parent: "@efffrida/gplayapi"
---

## PlayAccount.ts overview

Google play account credentials.

Since v1.0.0

---

## Exports Grouped by Category

- [Constants](#constants)
  - [defaultAuroraDispenserUrl](#defaultauroradispenserurl)
- [Errors](#errors)
  - [PlayAccountError (class)](#playaccounterror-class)
- [Layers](#layers)
  - [layerAuroraDispenser](#layerauroradispenser)
  - [layerConfig](#layerconfig)
  - [layerStatic](#layerstatic)
- [Models](#models)
  - [PlayAccountService (interface)](#playaccountservice-interface)
  - [PlayAccountStrategy (type alias)](#playaccountstrategy-type-alias)
  - [PlayCredentials (interface)](#playcredentials-interface)
- [Tags](#tags)
  - [PlayAccount (class)](#playaccount-class)

---

# Constants

## defaultAuroraDispenserUrl

The anonymous account dispenser that the Aurora store uses.

**Signature**

```ts
declare const defaultAuroraDispenserUrl: string
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L75)

Since v1.0.0

# Errors

## PlayAccountError (class)

**Signature**

```ts
declare class PlayAccountError
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L31)

Since v1.0.0

# Layers

## layerAuroraDispenser

Dispenses anonymous credentials from an Aurora store compatible dispenser.
Note that the hosted dispenser blocks/rate limits datacenter ip ranges, so
this layer is a poor fit for anything running on cloud infrastructure.

**Signature**

```ts
declare const layerAuroraDispenser: (url?: string) => Layer.Layer<PlayAccount, never, HttpClient.HttpClient>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L91)

Since v1.0.0

## layerConfig

Reads credentials that were obtained out of band from the config provider,
defaulting to the `GPLAY_EMAIL` and `GPLAY_AUTH_TOKEN` environment
variables.

**Signature**

```ts
declare const layerConfig: (
  options?:
    | { email?: Config.Config<string> | undefined; token?: Config.Config<Redacted.Redacted<string>> | undefined }
    | undefined
) => Layer.Layer<PlayAccount, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L125)

Since v1.0.0

## layerStatic

Serves credentials that are already in hand, which is mostly useful for
tests and for applications that fetch their token out of band.

**Signature**

```ts
declare const layerStatic: (credentials: PlayCredentials) => Layer.Layer<PlayAccount, never, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L148)

Since v1.0.0

# Models

## PlayAccountService (interface)

Holds an effect that yields credentials rather than the credentials
themselves, so that re-running it re-executes the acquisition strategy. That
is what makes invalidating cached auth headers meaningful.

**Signature**

```ts
export interface PlayAccountService {
  readonly credentials: Effect.Effect<PlayCredentials, PlayAccountError, never>
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L59)

Since v1.0.0

## PlayAccountStrategy (type alias)

The strategy that was used when acquiring the credentials failed.

**Signature**

```ts
type PlayAccountStrategy = "aurora-dispenser" | "config"
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L25)

Since v1.0.0

## PlayCredentials (interface)

The credentials that the google play endpoints are authenticated with.

**Signature**

```ts
export interface PlayCredentials {
  readonly email: string
  readonly token: Redacted.Redacted<string>
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L46)

Since v1.0.0

# Tags

## PlayAccount (class)

**Signature**

```ts
declare class PlayAccount
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/gplayapi/src/PlayAccount.ts#L67)

Since v1.0.0
