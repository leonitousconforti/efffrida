import { describe, expect, it } from "vitest";
import { A } from "./shared.ts";

describe("vitest-pool spec2", () => {
    it("placeholder test", () => {
        expect(true).toBe(true);
        expect(A).toBe(42);
    });

    it("can access Frida APIs", () => {
        expect(Frida.version).toBe("17.5.1");
    });
});
