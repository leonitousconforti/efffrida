---
"@efffrida/frida-tools": patch
---

The Android emulator device restarts frida-server when it exits, up to 5 times over the life of the device. Once a script's session detaches, its `stream`, `sink` and `callExport` fail with a `FridaSessionError` whose `when` is `"detached"`, including calls that were already running, so callers can retry with a new session. Add `FridaDevice.awaitReachable`, which waits until the device answers again.
