---
"@efffrida/gplayapi": patch
---

Make google play account acquisition pluggable through a new `PlayAccount` service.

`AndroidDevice.authHeaders` no longer hardcodes the Aurora dispenser fetch, so every
`GooglePlayApi.*` function now requires a `PlayAccount` layer in addition to the device and http
client layers. Three layers ship with it: `PlayAccount.layerAuroraDispenser` (the previous
behaviour, with a configurable url), `PlayAccount.layerConfig` (reads `GPLAY_EMAIL` and
`GPLAY_AUTH_TOKEN` by default), and `PlayAccount.layerStatic`. Add
`PlayAccount.layerAuroraDispenser()` to an existing composition to keep the old behaviour.

Cached auth headers are now dropped when google play answers with a 401 or a 403, and the request is
retried once with freshly acquired credentials instead of serving expired headers forever.
