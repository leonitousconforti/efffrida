import * as path from "node:path";
import type { ViteUserConfig } from "vitest/config";

const alias = (name: string) => {
    const target = process.env.TEST_DIST !== undefined ? "dist/dist/esm" : "src";
    return {
        [`${name}/test`]: path.join(__dirname, "packages", name, "test"),
        [`${name}`]: path.join(__dirname, "packages", name, target),
    };
};

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
    esbuild: {
        target: "es2020",
    },
    test: {
        setupFiles: [path.join(__dirname, "setupTests.ts")],
        fakeTimers: {
            toFake: undefined,
        },
        sequence: {
            concurrent: true,
        },
        include: ["test/**/*.test.ts"],
        alias: {
            ...alias("effect-frida-compile"),
            ...alias("effect-frida-il2cpp-bridge"),
            ...alias("effect-frida-tools"),
            ...alias("effect-platform-frida"),
            ...alias("effect-rpc-frida"),
            ...alias("effect-sql-frida"),
        },
    },
};

export default config;
