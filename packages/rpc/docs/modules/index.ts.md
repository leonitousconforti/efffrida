---
title: index.ts
nav_order: 3
parent: Modules
---

## index overview

Implements a Frida RPC client protocol for effect using the frida script
exports. The reason we don't use the send/recv script channels is because
those are shared channels by everybody.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "./FridaRpcClient.js"](#from-fridarpcclientjs)
  - [From "./FridaRpcServer.js"](#from-fridarpcserverjs)

---

# exports

## From "./FridaRpcClient.js"

Implements a Frida RPC client protocol for effect using the frida script
exports. The reason we don't use the send/recv script channels is because
those are shared channels by everybody.

**Signature**

```ts
export * as FridaRpcClient from "./FridaRpcClient.js"
```

Added in v1.0.0

## From "./FridaRpcServer.js"

Implements a Frida RPC server protocol for effect using the frida script
exports. The reason we don't use the send/recv script channels is because
those are shared channels by everybody.

**Signature**

```ts
export * as FridaRpcServer from "./FridaRpcServer.js"
```

Added in v1.0.0
