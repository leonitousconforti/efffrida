---
"@efffrida/gplayapi": patch
---

Break `AndroidDevice` out of `GooglePlayApi` into its own `AndroidDevice` module, mirroring the `PlayAccount` module.

`GooglePlayApi.AndroidDevice` and `GooglePlayApi.AndroidDeviceService` are no longer exported. Import them from the new module instead, either through the package index (`import { AndroidDevice } from "@efffrida/gplayapi"`) or through the subpath (`import * as AndroidDevice from "@efffrida/gplayapi/AndroidDevice"`).

The `EmbeddedPixel7aLive` layer also moved from a static on the `AndroidDevice` class to a top level export of the new module: `AndroidDevice.EmbeddedPixel7aLive`.
