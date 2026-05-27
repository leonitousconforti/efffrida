import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: [
            "packages/*/vitest.config.ts",
            "templates/agent-only/vitest.config.ts",
            "templates/app-and-agent/frida/vitest.config.ts",
            "templates/app-and-agent/node/vitest.config.ts",
        ],
    },
});
