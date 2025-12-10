import * as Frida from "frida";
import { mergeConfig, type ViteUserConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        // maxWorkers: 1,
        // fileParallelism: false,
        // sequence: {
        //     concurrent: true,
        // },
        pool:
            "CI" in process.env
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
