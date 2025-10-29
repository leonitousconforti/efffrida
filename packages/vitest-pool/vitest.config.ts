import { mergeConfig, type ViteUserConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        pool: createFridaPool({
            device: "local",
            preSpawn: true,
            spawn: ["sleep", "infinity"],
        }),
    },
};

export default mergeConfig(shared, config);
