import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";
import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        pool: process.env.CI
            ? createFridaPool({
                  device: { connection: "local" },
                  attach: { spawn: ["/usr/bin/sleep", "infinity"] },
              })
            : createFridaPool({
                  device: { connection: "local" },
                  attach: {
                      preSpawn: true,
                      spawn: ["sleep", "infinity"],
                  },
              }),
    },
};

export default mergeConfig(shared, config);
