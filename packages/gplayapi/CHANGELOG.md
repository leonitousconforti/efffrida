# @efffrida/gplayapi

## 0.0.29

### Patch Changes

- 8746f8b: Update Effect-TS packages to v4.0.0-rc.108

## 0.0.28

### Patch Changes

- 6e2d555: Update Effect-TS packages to v4.0.0-beta.106

## 0.0.27

### Patch Changes

- 0d7b9e5: Update Effect-TS packages to v4.0.0-beta.105
- 7de828a: Make google play account acquisition pluggable through a new `PlayAccount` service.

    `AndroidDevice.authHeaders` no longer hardcodes the Aurora dispenser fetch, so every
    `GooglePlayApi.*` function now requires a `PlayAccount` layer in addition to the device and http
    client layers. Three layers ship with it: `PlayAccount.layerAuroraDispenser` (the previous
    behaviour, with a configurable url), `PlayAccount.layerConfig` (reads `GPLAY_EMAIL` and
    `GPLAY_AUTH_TOKEN` by default), and `PlayAccount.layerStatic`. Add
    `PlayAccount.layerAuroraDispenser()` to an existing composition to keep the old behaviour.

    Auth headers used to be cached on the device forever, so a long lived process eventually served
    expired headers with no way to recover. They now expire after 30 minutes, and a 401 or a 403 from
    google play evicts them early so the next call acquires a fresh set.

- aac9fa9: Break `AndroidDevice` out of `GooglePlayApi` into its own `AndroidDevice` module, mirroring the `PlayAccount` module.

    `GooglePlayApi.AndroidDevice` and `GooglePlayApi.AndroidDeviceService` are no longer exported. Import them from the new module instead, either through the package index (`import { AndroidDevice } from "@efffrida/gplayapi"`) or through the subpath (`import * as AndroidDevice from "@efffrida/gplayapi/AndroidDevice"`).

    The statics on the `AndroidDevice` class also moved to top level exports of the new module: `AndroidDevice.fromPropertiesFile`, `AndroidDevice.EmbeddedPixel7a`, and `AndroidDevice.EmbeddedPixel7aLive`.

## 0.0.26

### Patch Changes

- e6d83ef: Update Effect-TS packages to v4.0.0-beta.104

## 0.0.25

### Patch Changes

- 8c291bb: Update Effect-TS packages to v4.0.0-beta.103

## 0.0.24

### Patch Changes

- a59a3cc: Update Effect-TS packages to v4.0.0-beta.102

## 0.0.23

### Patch Changes

- 46c6be4: Update Effect-TS packages to v4.0.0-beta.101

## 0.0.22

### Patch Changes

- 43cc217: Update dependency @bufbuild/protobuf to v2.13.0

## 0.0.21

### Patch Changes

- 35bd1e9: Update Effect-TS packages to v4.0.0-beta.100

## 0.0.20

### Patch Changes

- 62e96ee: Update Effect-TS packages to v4.0.0-beta.99

## 0.0.19

### Patch Changes

- dcf304c: Update bufbuild packages
- 5f96136: Update Effect-TS packages to v4.0.0-beta.98

## 0.0.18

### Patch Changes

- c1b2f7f: Fix `downloadToDisk` to make the temp files with a ".apk" suffix so they are accepted by adb commands

## 0.0.17

### Patch Changes

- e43820d: Better error handling when requesting downloads for apks

## 0.0.16

### Patch Changes

- ea099f1: Switch android device from being a function parameter to a service. Add streaming apis for downloading apks but not writing them to disk

## 0.0.15

### Patch Changes

- 8d99013: Make re-exported AndroidDevice class public

## 0.0.14

### Patch Changes

- b6b26e6: Bump tar and ioredis dependencies

## 0.0.13

### Patch Changes

- 6a69bda: Bump dependencies

## 0.0.12

### Patch Changes

- 0b4af19: Test publish after modifying changeset config

## 0.0.11

### Patch Changes

- 76b7c23: Bump dependencies

## 0.0.10

### Patch Changes

- 325d6fd: Migrate to effect-smol

## 0.0.9

### Patch Changes

- 0aed69e: Test new publishing workflow

## 0.0.8

### Patch Changes

- 0009f3f: Bump dependencies

## 0.0.7

### Patch Changes

- fe03a5c: Bumped dependencies
