import { Effect, Fiber, Layer, Option, Schema, Stream } from "effect";

import { assert, describe, expect, it } from "@effect/vitest";
import { FridaScript, FridaSession, FridaSessionError } from "@efffrida/frida-tools";

import { FridaLive } from "../base.ts";

// Every test detaches its session, so each one gets its own, which takes a
// spawn and a compile
const ScriptLive = FridaScript.layer(new URL("main.agent.ts", import.meta.url)).pipe(Layer.provideMerge(FridaLive));

const timeout = 30_000;

const detach = Effect.flatMap(FridaSession.FridaSession, ({ session }) => Effect.promise(() => session.detach()));

const expectDetached = (error: unknown) => {
    assert.instanceOf(error, FridaSessionError.FridaSessionError);
    expect(error.when).toBe("detached");
};

describe("a script whose session detaches", () => {
    it.live(
        "fails calls made after the detach",
        () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                expect(yield* script.callExport("ping", Schema.String)()).toBe("pong");
                yield* detach;
                expectDetached(yield* Effect.flip(script.callExport("ping", Schema.String)()));
            }).pipe(Effect.provide(ScriptLive)),
        timeout
    );

    it.live(
        "fails calls that were running when it detached",
        () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const fiber = yield* Effect.forkChild(script.callExport("hang", Schema.Never)(), {
                    startImmediately: true,
                });
                yield* detach;
                expectDetached(yield* Effect.flip(Fiber.join(fiber)));
            }).pipe(Effect.provide(ScriptLive)),
        timeout
    );

    it.live(
        "fails its stream",
        () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                const fiber = yield* Effect.forkChild(Stream.runDrain(script.stream), { startImmediately: true });
                yield* detach;
                expectDetached(yield* Effect.flip(Fiber.join(fiber)));
            }).pipe(Effect.provide(ScriptLive)),
        timeout
    );

    it.live(
        "fails its sink",
        () =>
            Effect.gen(function* () {
                const script = yield* FridaScript.FridaScript;
                yield* detach;
                const error = yield* Stream.make({ message: "hello", data: Option.none() }).pipe(
                    Stream.run(script.sink),
                    Effect.flip
                );
                expectDetached(error);
            }).pipe(Effect.provide(ScriptLive)),
        timeout
    );
});
