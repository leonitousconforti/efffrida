---
title: FridaDevice.ts
nav_order: 1
parent: Modules
---

## FridaDevice.ts overview

Frida devices

Since v1.0.0

---

## Exports Grouped by Category

- [Device acquisition](#device-acquisition)
  - [acquireAndroidEmulatorDevice](#acquireandroidemulatordevice)
  - [acquireLocalDevice](#acquirelocaldevice)
  - [acquireRemoteDevice](#acquireremotedevice)
  - [acquireUsbDevice](#acquireusbdevice)
- [Layers](#layers)
  - [layerAndroidEmulatorDevice](#layerandroidemulatordevice)
  - [layerLocalDevice](#layerlocaldevice)
  - [layerRemoteDevice](#layerremotedevice)
  - [layerUsbDevice](#layerusbdevice)
- [Models](#models)
  - [FridaDevice (interface)](#fridadevice-interface)
- [Predicates](#predicates)
  - [isFridaDevice](#isfridadevice)
- [Tags](#tags)
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
      }
    | undefined
) => Effect.Effect<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  CommandExecutor.CommandExecutor | Scope.Scope
>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L84)

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

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L55)

Since v1.0.0

## acquireRemoteDevice

**Signature**

```ts
declare const acquireRemoteDevice: (
  address: string,
  options?: Frida.RemoteDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, Scope.Scope>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L74)

Since v1.0.0

## acquireUsbDevice

**Signature**

```ts
declare const acquireUsbDevice: (
  options?: Frida.GetDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L65)

Since v1.0.0

# Layers

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
      }
    | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, CommandExecutor.CommandExecutor>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L132)

Since v1.0.0

## layerLocalDevice

**Signature**

```ts
declare const layerLocalDevice: Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L104)

Since v1.0.0

## layerRemoteDevice

**Signature**

```ts
declare const layerRemoteDevice: (
  address: string,
  options?: Frida.RemoteDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L114)

Since v1.0.0

## layerUsbDevice

**Signature**

```ts
declare const layerUsbDevice: (
  options?: Frida.GetDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L124)

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

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L33)

Since v1.0.0

# Predicates

## isFridaDevice

**Signature**

```ts
declare const isFridaDevice: (u: unknown) => u is FridaDevice
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L49)

Since v1.0.0

# Tags

## FridaDevice

**Signature**

```ts
declare const FridaDevice: Context.Tag<FridaDevice, FridaDevice>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L43)

Since v1.0.0

# Type ids

## FridaDeviceTypeId

**Signature**

```ts
declare const FridaDeviceTypeId: unique symbol
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L21)

Since v1.0.0

## FridaDeviceTypeId (type alias)

**Signature**

```ts
type FridaDeviceTypeId = typeof FridaDeviceTypeId
```

[Source](https://github.com/leonitousconforti/efffrida/packages/frida-tools/blob/main/src/FridaDevice.ts#L27)

Since v1.0.0
