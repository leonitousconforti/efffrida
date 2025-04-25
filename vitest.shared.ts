import * as path from "node:path";
import type { ViteUserConfig } from "vitest/config";

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
    esbuild: {
        target: "es2020",
    },
    test: {
        setupFiles: [path.join(__dirname, "vitest.setup.ts")],
        fakeTimers: {
            toFake: undefined,
        },
        sequence: {
            concurrent: true,
        },
        include: ["test/**/*.test.ts"],
    },
};

export default config;
