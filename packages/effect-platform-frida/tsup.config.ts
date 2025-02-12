import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["test/playground.ts"],
    clean: true,
    publicDir: true,
    treeshake: "smallest",
    noExternal: [/(.*)/],
});
