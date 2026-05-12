import { createFridaPool } from "@efffrida/vitest-pool";
import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";

const config: ViteUserConfig = {
    test: {
        sequence: {
            groupOrder: 3,
        },
        pool: process.env.CI
            ? createFridaPool({
                  device: "local",
                  spawn: ["/usr/bin/sleep", "infinity"],
              })
            : createFridaPool({
                  device: "local",
                  preSpawn: true,
                  spawn: ["sleep", "infinity"],
              }),
    },
};

export default mergeConfig(shared, config);
