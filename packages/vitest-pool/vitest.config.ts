import * as Frida from "frida";
import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";
import { createFridaPool } from "./src/index.ts";

const config: ViteUserConfig = {
    test: {
        sequence: {
            groupOrder: 2,
        },
        pool: createFridaPool({
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
