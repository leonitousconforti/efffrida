---
"@efffrida/gplayapi": patch
---

Break `AndroidDevice` out of `GooglePlayApi` into its own `AndroidDevice` module, mirroring the `PlayAccount` module.

`GooglePlayApi.AndroidDevice` and `GooglePlayApi.AndroidDeviceService` are no longer exported. Import them from the new module instead, either through the package index (`import { AndroidDevice } from "@efffrida/gplayapi"`) or through the subpath (`import * as AndroidDevice from "@efffrida/gplayapi/AndroidDevice"`).

The statics on the `AndroidDevice` class also moved to top level exports of the new module: `AndroidDevice.fromPropertiesFile`, `AndroidDevice.EmbeddedPixel7a`, and `AndroidDevice.EmbeddedPixel7aLive`.
