---
title: FridaDevice.ts
nav_order: 1
parent: "@efffrida/frida-tools"
---

## FridaDevice.ts overview

Frida devices

Since v1.0.0

---

## Exports Grouped by Category

- [Device acquisition](#device-acquisition)
  - [acquireAndroidEmulatorDevice](#acquireandroidemulatordevice)
  - [acquireAndroidEmulatorDeviceConfig](#acquireandroidemulatordeviceconfig)
  - [acquireLocalDevice](#acquirelocaldevice)
  - [acquireRemoteDevice](#acquireremotedevice)
  - [acquireUsbDevice](#acquireusbdevice)
- [Layers](#layers)
  - [DeviceLive](#devicelive)
  - [layerAndroidEmulatorDevice](#layerandroidemulatordevice)
  - [layerAndroidEmulatorDeviceConfig](#layerandroidemulatordeviceconfig)
  - [layerLocalDevice](#layerlocaldevice)
  - [layerRemoteDevice](#layerremotedevice)
  - [layerUsbDevice](#layerusbdevice)
- [Models](#models)
  - [FridaDevice (interface)](#fridadevice-interface)
- [Predicates](#predicates)
  - [isFridaDevice](#isfridadevice)
- [Schemas](#schemas)
  - [DeviceSchema](#deviceschema)
- [Services](#services)
  - [FridaDevice](#fridadevice)
- [Type ids](#type-ids)
  - [FridaDeviceTypeId](#fridadevicetypeid)
  - [FridaDeviceTypeId (type alias)](#fridadevicetypeid-type-alias)

---

# Device acquisition

## acquireAndroidEmulatorDevice

**Signature**

```ts
declare const acquireAndroidEmulatorDevice: (
  name: string,
  options?:
    | {
        hidden?: boolean | undefined
        adbExecutable?: string | undefined
        fridaExecutable?: string | undefined
        emulatorExecutable?: string | undefined
        extraEmulatorArgs?: ReadonlyArray<string> | undefined
      }
    | undefined
) => Effect.Effect<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  ChildProcessSpawner.ChildProcessSpawner | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L88)

Since v1.0.0

## acquireAndroidEmulatorDeviceConfig

Like `acquireAndroidEmulatorDevice`, but resolves `adb` and `emulator`
from the `ANDROID_HOME` environment variable, falling back to the PATH when
it is not set.

**Signature**

```ts
declare const acquireAndroidEmulatorDeviceConfig: (
  name: string,
  options?:
    | {
        hidden?: boolean | undefined
        fridaExecutable?: string | undefined
        extraEmulatorArgs?: ReadonlyArray<string> | undefined
      }
    | undefined
) => Effect.Effect<
  FridaDevice,
  Config.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  ChildProcessSpawner.ChildProcessSpawner | Path.Path | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L113)

Since v1.0.0

## acquireLocalDevice

**Signature**

```ts
declare const acquireLocalDevice: () => Effect.Effect<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  never
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L59)

Since v1.0.0

## acquireRemoteDevice

**Signature**

```ts
declare const acquireRemoteDevice: (
  address: string,
  options?: Frida.RemoteDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L78)

Since v1.0.0

## acquireUsbDevice

**Signature**

```ts
declare const acquireUsbDevice: (
  options?: Frida.GetDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L69)

Since v1.0.0

# Layers

## DeviceLive

**Signature**

```ts
declare const DeviceLive: (
  config: Schema.Schema.Type<typeof DeviceSchema>
) => Layer.Layer<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  ChildProcessSpawner.ChildProcessSpawner
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L236)

Since v1.0.0

## layerAndroidEmulatorDevice

**Signature**

```ts
declare const layerAndroidEmulatorDevice: (
  name: string,
  options?:
    | {
        hidden?: boolean | undefined
        adbExecutable?: string | undefined
        fridaExecutable?: string | undefined
        emulatorExecutable?: string | undefined
        extraEmulatorArgs?: ReadonlyArray<string> | undefined
      }
    | undefined
) => Layer.Layer<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  ChildProcessSpawner.ChildProcessSpawner
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L160)

Since v1.0.0

## layerAndroidEmulatorDeviceConfig

Like `layerAndroidEmulatorDevice`, but resolves `adb` and `emulator`
from the `ANDROID_HOME` environment variable, falling back to the PATH when
it is not set.

**Signature**

```ts
declare const layerAndroidEmulatorDeviceConfig: (
  name: string,
  options?:
    | {
        hidden?: boolean | undefined
        fridaExecutable?: string | undefined
        extraEmulatorArgs?: ReadonlyArray<string> | undefined
      }
    | undefined
) => Layer.Layer<
  FridaDevice,
  Config.ConfigError | FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  ChildProcessSpawner.ChildProcessSpawner | Path.Path
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L185)

Since v1.0.0

## layerLocalDevice

**Signature**

```ts
declare const layerLocalDevice: Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L132)

Since v1.0.0

## layerRemoteDevice

**Signature**

```ts
declare const layerRemoteDevice: (
  address: string,
  options?: Frida.RemoteDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L142)

Since v1.0.0

## layerUsbDevice

**Signature**

```ts
declare const layerUsbDevice: (
  options?: Frida.GetDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L152)

Since v1.0.0

# Models

## FridaDevice (interface)

**Signature**

```ts
export interface FridaDevice {
  readonly device: Frida.Device
  readonly host: `usb://` | `local://` | `remote://${string}` | `android-emulator://${string}`
  readonly [FridaDeviceTypeId]: typeof FridaDeviceTypeId
}
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L37)

Since v1.0.0

# Predicates

## isFridaDevice

**Signature**

```ts
declare const isFridaDevice: (u: unknown) => u is FridaDevice
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L53)

Since v1.0.0

# Schemas

## DeviceSchema

**Signature**

```ts
declare const DeviceSchema: Schema.Union<
  readonly [
    Schema.Struct<{ readonly connection: Schema.Literal<"local"> }>,
    Schema.Struct<{
      readonly connection: Schema.Literal<"usb">
      readonly timeout: Schema.optional<Schema.DurationFromMillis>
    }>,
    Schema.Struct<{
      readonly address: Schema.String
      readonly connection: Schema.Literal<"remote">
      readonly token: Schema.optional<Schema.String>
      readonly origin: Schema.optional<Schema.String>
      readonly keepaliveInterval: Schema.optional<Schema.DurationFromMillis>
    }>,
    Schema.Struct<{
      readonly emulatorName: Schema.String
      readonly hidden: Schema.optional<Schema.Boolean>
      readonly adbExecutable: Schema.optional<Schema.String>
      readonly connection: Schema.Literal<"android-emulator">
      readonly fridaExecutable: Schema.optional<Schema.String>
      readonly emulatorExecutable: Schema.optional<Schema.String>
      readonly extraEmulatorArgs: Schema.optional<Schema.$Array<Schema.String>>
    }>
  ]
>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L204)

Since v1.0.0

# Services

## FridaDevice

**Signature**

```ts
declare const FridaDevice: Context.Service<FridaDevice, FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L47)

Since v1.0.0

# Type ids

## FridaDeviceTypeId

**Signature**

```ts
declare const FridaDeviceTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L25)

Since v1.0.0

## FridaDeviceTypeId (type alias)

**Signature**

```ts
type FridaDeviceTypeId = typeof FridaDeviceTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/blob/main/packages/frida-tools/src/FridaDevice.ts#L31)

Since v1.0.0
