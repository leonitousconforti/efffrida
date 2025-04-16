---
title: FridaCompile.ts
nav_order: 1
parent: Modules
---

## FridaCompile overview

Compiles a Frida agent using tsup.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Compile](#compile)
  - [compileAgent](#compileagent)

---

# Compile

## compileAgent

**Signature**

```ts
export declare const compileAgent: (
  agentLocation: string | URL,
  tsconfig?: string | URL | undefined
) => Effect.Effect<string, never, FileSystem.FileSystem | Path.Path>
```

Added in v1.0.0
