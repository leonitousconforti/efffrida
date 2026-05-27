import { Effect } from "effect";

import { describe, it, expect } from "@effect/vitest";
import { FridaVersion } from "agent-only";

describe("agent tests", () => {
    it.effect("should have the correct frida version", () =>
        Effect.gen(function* () {
            const version = yield* FridaVersion.use((frida) => frida.version);
            expect(version).toBe("17.9.11");
        }).pipe(Effect.provide(FridaVersion.default))
    );
});
