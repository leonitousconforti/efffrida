---
title: FridaDevice.ts
nav_order: 1
parent: Modules
---

## FridaDevice overview

Frida devices

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Device acquisition](#device-acquisition)
  - [acquireLocalDevice](#acquirelocaldevice)
  - [acquireRemoteDevice](#acquireremotedevice)
  - [acquireUsbDevice](#acquireusbdevice)
- [Layers](#layers)
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

## acquireLocalDevice

**Signature**

```ts
export declare const acquireLocalDevice: () => Effect.Effect<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  never
>
```

Added in v1.0.0

## acquireRemoteDevice

**Signature**

```ts
export declare const acquireRemoteDevice: (
  address: string,
  options?: Frida.RemoteDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

Added in v1.0.0

## acquireUsbDevice

**Signature**

```ts
export declare const acquireUsbDevice: (
  options?: Frida.GetDeviceOptions | undefined
) => Effect.Effect<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

Added in v1.0.0

# Layers

## layerLocalDevice

**Signature**

```ts
export declare const layerLocalDevice: Layer.Layer<
  FridaDevice,
  FridaDeviceAcquisitionError.FridaDeviceAcquisitionError,
  never
>
```

Added in v1.0.0

## layerRemoteDevice

**Signature**

```ts
export declare const layerRemoteDevice: (
  address: string,
  options?: Frida.RemoteDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

Added in v1.0.0

## layerUsbDevice

**Signature**

```ts
export declare const layerUsbDevice: (
  options?: Frida.GetDeviceOptions | undefined
) => Layer.Layer<FridaDevice, FridaDeviceAcquisitionError.FridaDeviceAcquisitionError, never>
```

Added in v1.0.0

# Models

## FridaDevice (interface)

**Signature**

```ts
export interface FridaDevice {
  readonly device: Frida.Device
  readonly [FridaDeviceTypeId]: typeof FridaDeviceTypeId
}
```

Added in v1.0.0

# Predicates

## isFridaDevice

**Signature**

```ts
export declare const isFridaDevice: (u: unknown) => u is FridaDevice
```

Added in v1.0.0

# Tags

## FridaDevice

**Signature**

```ts
export declare const FridaDevice: Context.Tag<FridaDevice, FridaDevice>
```

Added in v1.0.0

# Type ids

## FridaDeviceTypeId

**Signature**

```ts
export declare const FridaDeviceTypeId: typeof FridaDeviceTypeId
```

Added in v1.0.0

## FridaDeviceTypeId (type alias)

**Signature**

```ts
export type FridaDeviceTypeId = typeof FridaDeviceTypeId
```

Added in v1.0.0
