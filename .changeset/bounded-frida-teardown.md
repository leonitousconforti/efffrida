---
"@efffrida/frida-tools": patch
---

Bound teardown. Unloading a script, detaching a session, killing a spawned process and removing a remote device now give up after 10 seconds with a warning, so one Frida call that never settles no longer blocks the finalizers after it. The Android emulator device also bounds `emu kill` and force kills the emulator and the `adb shell` running frida-server if they do not exit after SIGTERM. A script unload that rejects is now ignored instead of raising a defect.
