---
"@efffrida/frida-tools": patch
---

The Android emulator device restarts frida-server when it exits, up to 5 times over the life of the device, and starts it with stdin from `/dev/null` so that a crashed frida-server no longer leaves `adb shell` running <https://github.com/frida/frida-core/issues/1288>. Add `FridaSession.failOnDetached`, which fails with a `FridaSessionError` whose `when` is `"detached"` when the session detaches while an effect runs, so callers can retry with a new session, and `FridaDevice.awaitReachable`, which waits until the device answers again.
