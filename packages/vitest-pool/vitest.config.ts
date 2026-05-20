import * as Frida from "frida";
import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";
import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        pool: process.env.CI
            ? createFridaPool({
                  platform: Frida.JsPlatform.Gum,
                  runtime: Frida.ScriptRuntime.Default,
                  device: { connection: "local" },
                  attach: { spawn: ["/usr/bin/sleep", "50"] },
              })
            : createFridaPool({
                  platform: Frida.JsPlatform.Gum,
                  runtime: Frida.ScriptRuntime.Default,
                  device: { connection: "local" },
                  attach: {
                      preSpawn: true,
                      spawn: ["sleep", "infinity"],
                  },
              }),
    },
};

export default mergeConfig(shared, config);
