import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        fileParallelism: false,
        projects: ["packages/frida-tools/vitest.config.ts", "packages/vitest-pool/vitest.config.ts"],
    },
});
