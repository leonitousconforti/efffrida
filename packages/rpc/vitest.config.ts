import { mergeConfig, type ViteUserConfig } from "vitest/config";

import shared from "../../vitest.shared.ts";

const config: ViteUserConfig = {
    test: {
        sequence: {
            groupOrder: 3,
        },
    },
};

export default mergeConfig(shared, config);
