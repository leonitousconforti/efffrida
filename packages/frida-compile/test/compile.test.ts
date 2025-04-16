import { describe, it } from "@effect/vitest";

import { NodeContext } from "@effect/platform-node";
import { FridaCompile } from "@efffrida/frida-compile";
import { Effect } from "effect";

describe("Should compile the agent", () => {
    it.effect("single file agent", () =>
        Effect.gen(function* () {
            yield* FridaCompile.compileAgent(new URL("../frida/agent1/main.ts", import.meta.url));
            // expect(source).toMatchSnapshot();
        }).pipe(Effect.provide(NodeContext.layer))
    );

    it.effect("double file agent", () =>
        Effect.gen(function* () {
            yield* FridaCompile.compileAgent(new URL("../frida/agent2/main.ts", import.meta.url));
            // expect(source).toMatchSnapshot();
        }).pipe(Effect.provide(NodeContext.layer))
    );

    it.effect("conflicting exports agent", () =>
        Effect.gen(function* () {
            yield* FridaCompile.compileAgent(new URL("../frida/agent3/main.ts", import.meta.url));
            // expect(source).toMatchSnapshot();
        }).pipe(Effect.provide(NodeContext.layer))
    );
});
