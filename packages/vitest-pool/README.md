# @efffrida/vitest-pool

A vitest pool that runs test files inside a frida agent, so tests execute in the
target process instead of in node.

### Example usage

```typescript
import { createFridaPool } from "@efffrida/vitest-pool";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        pool: createFridaPool({
            device: { connection: "local" },
            attach: { spawn: ["/usr/bin/sleep", "infinity"] },
        }),
    },
});
```

Each worker writes an agent into a temporary `.vitest-frida-pool-*` directory
under the project root, compiles it with frida's compiler, and loads it into the
attached session. Worker initialization is serialized, so only one agent is
compiled and attached at a time.

### Vitest patch

The agent imports vitest's test runner (`startTests` and `collectTests` from
`vitest/internal/browser`), which lives in `vitest/dist/chunks/run.BPv-BBRv.js`.
That chunk contains the regex `/\$([$\p{ID_Continue}.]+)/gu` used to interpolate
`test.each` titles, and frida's JS runtime can't parse unicode property escapes
(see [frida/frida-gum#1195](https://github.com/frida/frida-gum/issues/1195)), so
loading the agent fails with a syntax error.

[`patches/vitest@5.0.5.patch`](../../patches/vitest@5.0.5.patch) replaces it
with `/\$([$\w.]+)/g`. The only behavior change is that `$name` interpolation in
`test.each` titles matches ascii identifiers only.

The patch targets a content hashed chunk name, so it has to be regenerated
whenever vitest is bumped, even if the regex itself is unchanged. Run `pnpm
patch vitest@<version>`, apply the same change to whichever `run.*.js` chunk now
contains the regex, then `pnpm patch-commit` and update `patchedDependencies` in
`pnpm-workspace.yaml`. Projects outside this repository that use the pool need
to apply the same patch.
