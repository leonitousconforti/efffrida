import { createFridaPool } from "@efffrida/vitest-pool";
import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";

const config: ViteUserConfig = {
    test: {
        sequence: {
            groupOrder: 3,
        },
        pool: createFridaPool({
            device: { connection: "local" },
            attach: {
                preSpawn: true,
                spawn: ["sleep", "infinity"],
            },
        }),
    },
};

export default mergeConfig(shared, config);
