import * as path from "node:path";
import type { ViteUserConfig } from "vitest/config";

const alias = (pkg: string, dir = pkg) => {
    const name = `@efffrida/${pkg}`;
    const target = process.env.TEST_DIST !== undefined ? path.join("dist", "dist", "esm") : "src";
    return {
        [`${name}/test`]: path.join(__dirname, "packages", dir, "test"),
        [`${name}`]: path.join(__dirname, "packages", dir, target),
    };
};

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
        alias: {
            ...alias("frida-compile"),
            ...alias("frida-tools"),
            ...alias("il2cpp-bridge"),
            ...alias("platform"),
            ...alias("rpc"),
            ...alias("sql"),
        },
    },
};

export default config;
