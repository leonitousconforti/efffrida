import * as Frida from "frida";
import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";
import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        sequence: {
            groupOrder: 2,
        },
        pool: process.env.CI
            ? createFridaPool({
                  device: "local",
                  spawn: ["/usr/bin/sleep", "infinity"],
                  platform: Frida.JsPlatform.Gum,
                  runtime: Frida.ScriptRuntime.Default,
              })
            : createFridaPool({
                  device: "local",
                  preSpawn: true,
                  spawn: ["sleep", "infinity"],
                  platform: Frida.JsPlatform.Gum,
                  runtime: Frida.ScriptRuntime.Default,
              }),
    },
};

export default mergeConfig(shared, config);
