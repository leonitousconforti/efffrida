import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: ["packages/frida-tools/vitest.config.ts"],
    },
});
