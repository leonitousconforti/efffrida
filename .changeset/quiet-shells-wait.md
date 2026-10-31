---
"@efffrida/frida-tools": patch
---

Fix `preSpawn` attach timing out on Linux. The target is now started from a shell so that libuv never reaps its ptrace stops, see [frida/frida-core#1277](https://github.com/frida/frida-core/issues/1277)
