import { Context, Effect, Exit, Layer, Scope } from "effect";

import * as fs from "node:fs";

import { NodeServices } from "@effect/platform-node";
import { describe, expect, it } from "@effect/vitest";
import { FridaDevice, FridaSession } from "@efffrida/frida-tools";

/** Reads a field of /proc/<pid>/status, undefined once the process is gone */
const procStatus = (pid: number, field: string): string | undefined => {
    try {
        return new RegExp(`^${field}:\\s*(.*)$`, "m").exec(fs.readFileSync(`/proc/${pid}/status`, "utf8"))?.[1];
    } catch {
        return undefined;
    }
};

const isRunning = (pid: number): boolean => {
    const state = procStatus(pid, "State");
    return state !== undefined && !state.startsWith("Z");
};

describe("preSpawn", () => {
    it.live.skipIf(process.platform !== "linux")(
        "attaches to a grandchild and kills it when the scope closes",
        () =>
            Effect.gen(function* () {
                const scope = yield* Scope.make();
                const SessionLive = FridaSession.SessionLive({ preSpawn: true, spawn: ["sleep", "infinity"] }).pipe(
                    Layer.provide(Layer.merge(FridaDevice.layerLocalDevice, NodeServices.layer))
                );
                const context = yield* Layer.buildWithScope(SessionLive, scope);
                const { pid } = Context.get(context, FridaSession.FridaSession);

                // Not a child of this process, so that libuv never waits for it
                expect(isRunning(pid)).toBe(true);
                expect(procStatus(pid, "PPid")).not.toBe(String(process.pid));

                yield* Scope.close(scope, Exit.void);
                yield* Effect.sleep("100 millis");
                expect(isRunning(pid)).toBe(false);
            }),
        30_000
    );
});
