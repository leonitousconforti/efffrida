import url from "node:url";

import type { ViteUserConfig } from "vitest/config";

import { defaultClientConditions, defaultServerConditions } from "vite";

const config: ViteUserConfig = {
    resolve: {
        tsconfigPaths: true,
        conditions: ["efffrida-src", ...defaultClientConditions],
    },
    ssr: {
        resolve: {
            conditions: ["efffrida-src", ...defaultServerConditions],
        },
    },
    test: {
        setupFiles: [url.fileURLToPath(new URL("./vitest.setup.ts", import.meta.url))],
        fakeTimers: {
            toFake: undefined,
        },
        sequence: {
            concurrent: true,
        },
        include: ["test/**/*.test.ts"],
        reporters: ["default", "hanging-process", ["junit", { outputFile: "./coverage/junit.xml" }]],
    },
};

export default config;
