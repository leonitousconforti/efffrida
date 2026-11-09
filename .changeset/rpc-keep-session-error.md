---
"@efffrida/rpc": patch
---

When the script's message stream fails, the node `FridaRpcClient` now keeps the `FridaSessionError` as the cause of the `RpcClientDefect` instead of only that error's own cause, so callers can see its `when`, e.g. `"detached"` after the session detaches.
