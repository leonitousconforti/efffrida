import { createFridaPool } from "@efffrida/vitest-pool";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
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
});
