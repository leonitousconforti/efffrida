import { mergeConfig, type ViteUserConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

const config: ViteUserConfig = {
    test: {
        // For GitHub Actions 🤮
        hookTimeout: 30_000,
    },
};

export default mergeConfig(shared, config);
