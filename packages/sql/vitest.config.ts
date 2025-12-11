import { mergeConfig, type ViteUserConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

import { createFridaPool } from "@efffrida/vitest-pool";

const config: ViteUserConfig = {
    test: {
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
