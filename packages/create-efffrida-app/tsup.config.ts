import { defineConfig } from "tsup";

import packageJson from "./package.json" with { type: "json" };

export default defineConfig({
    entry: ["src/bin.ts"],
    clean: true,
    treeshake: "smallest",
    define: {
        __VERSION__: JSON.stringify(packageJson.version),
    },
});
