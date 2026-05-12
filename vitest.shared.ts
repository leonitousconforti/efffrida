import type { ViteUserConfig } from "vitest/config";

import path from "node:path";

const config: ViteUserConfig = {
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        setupFiles: [path.join(__dirname, "vitest.setup.ts")],
        fakeTimers: {
            toFake: undefined,
        },
        sequence: {
            concurrent: true,
        },
        fileParallelism: false,
        include: ["test/**/*.test.ts"],
        reporters: ["default", "hanging-process", ["junit", { outputFile: "./coverage/junit.xml" }]],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            reporter: ["cobertura", "text"],
            reportsDirectory: "coverage",
        },
    },
};

export default config;
