import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";

const config: ViteUserConfig = {
    test: {
        sequence: {
            groupOrder: 1,
        },
    },
};

export default mergeConfig(shared, config);
