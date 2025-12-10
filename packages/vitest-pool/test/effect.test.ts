import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { A } from "./shared.ts";

describe("vitest-pool effect", () => {
    it.effect("placeholder test", () =>
        Effect.gen(function* () {
            expect(A).toBe(42);
            expect(1 + 1).toBe(2);
        })
    );

    it("can access Frida APIs", () =>
        Effect.gen(function* () {
            expect(Frida.version).toBe("17.5.1");
        }));
});
