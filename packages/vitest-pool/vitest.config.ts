import { mergeConfig, type ViteUserConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        setupFiles: undefined,
        pool: createFridaPool({
            device: "local",
            preSpawn: true,
            spawn: ["sleep", "infinity"],
        }),
    },
};

const merged = mergeConfig(shared, config);
delete merged.test.setupFiles;
export default merged;
