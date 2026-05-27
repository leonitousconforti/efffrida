import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: ["frida/vitest.config.ts", "node/vitest.config.ts"],
    },
});
