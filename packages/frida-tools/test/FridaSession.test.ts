import { Deferred, Effect, Exit, Fiber, Option } from "effect";
import { TestClock } from "effect/testing";

import { assert, describe, expect, it } from "@effect/vitest";
import { FridaSession, FridaSessionError } from "@efffrida/frida-tools";
import { SessionDetachReason } from "frida";

type DetachInfo = FridaSession.FridaSession["detached"] extends Deferred.Deferred<infer A, never> ? A : never;

const detachInfo: DetachInfo = {
    reason: SessionDetachReason.ConnectionTerminated,
    crash: Option.none(),
};

// failOnDetached only reads `detached`, so the rest of the session is never
// touched and no Frida device is needed
const makeSession = Effect.map(Deferred.make<DetachInfo>(), (detached) => ({
    detached,
    session: { detached } as unknown as FridaSession.FridaSession,
}));

describe("FridaSession.failOnDetached", () => {
    it.effect("succeeds with the value of the effect", () =>
        Effect.gen(function* () {
            const { session } = yield* makeSession;
            const value = yield* Effect.succeed(42).pipe(
                FridaSession.failOnDetached,
                Effect.provideService(FridaSession.FridaSession, session)
            );
            expect(value).toBe(42);
        })
    );

    it.effect('fails with "detached" and interrupts the effect when the session detaches while it runs', () =>
        Effect.gen(function* () {
            const { detached, session } = yield* makeSession;
            const interrupted = yield* Deferred.make<void>();
            const fiber = yield* Effect.never.pipe(
                Effect.onInterrupt(() => Deferred.succeed(interrupted, undefined)),
                FridaSession.failOnDetached,
                Effect.provideService(FridaSession.FridaSession, session),
                Effect.forkChild({ startImmediately: true })
            );

            yield* Deferred.succeed(detached, detachInfo);

            const error = yield* Effect.flip(Fiber.join(fiber));
            assert.instanceOf(error, FridaSessionError.FridaSessionError);
            expect(error.when).toBe("detached");
            expect(error.cause).toBe(detachInfo);
            expect(yield* Deferred.isDone(interrupted)).toBe(true);
        })
    );

    it.effect('fails with "detached" when the effect fails and the session detaches within 1 second', () =>
        Effect.gen(function* () {
            const { detached, session } = yield* makeSession;
            const fiber = yield* Effect.fail("script destroyed").pipe(
                FridaSession.failOnDetached,
                Effect.provideService(FridaSession.FridaSession, session),
                Effect.forkChild({ startImmediately: true })
            );

            yield* TestClock.adjust("500 millis");
            expect(fiber.pollUnsafe()).toBeUndefined();
            yield* Deferred.succeed(detached, detachInfo);

            const error = yield* Effect.flip(Fiber.join(fiber));
            assert.instanceOf(error, FridaSessionError.FridaSessionError);
            expect(error.when).toBe("detached");
            expect(error.cause).toBe(detachInfo);
        })
    );

    it.effect("fails with the original error when the session stays attached for 1 second", () =>
        Effect.gen(function* () {
            const { session } = yield* makeSession;
            const fiber = yield* Effect.fail("boom").pipe(
                FridaSession.failOnDetached,
                Effect.provideService(FridaSession.FridaSession, session),
                Effect.forkChild({ startImmediately: true })
            );

            yield* TestClock.adjust("999 millis");
            expect(fiber.pollUnsafe()).toBeUndefined();
            yield* TestClock.adjust("1 millis");

            const error = yield* Effect.flip(Fiber.join(fiber));
            expect(error).toBe("boom");
        })
    );

    // If interruptions were held like failures, this would wait for 1 second
    // on the test clock, which never advances, and the test would time out
    it.effect("passes an interruption of the effect through without waiting", () =>
        Effect.gen(function* () {
            const { session } = yield* makeSession;
            const exit = yield* Effect.interrupt.pipe(
                FridaSession.failOnDetached,
                Effect.provideService(FridaSession.FridaSession, session),
                Effect.exit
            );
            assert.isTrue(Exit.hasInterrupts(exit));
            assert.isFalse(Exit.hasFails(exit));
        })
    );

    it.effect("passes an interruption from the caller through and interrupts the effect", () =>
        Effect.gen(function* () {
            const { session } = yield* makeSession;
            const interrupted = yield* Deferred.make<void>();
            const fiber = yield* Effect.never.pipe(
                Effect.onInterrupt(() => Deferred.succeed(interrupted, undefined)),
                FridaSession.failOnDetached,
                Effect.provideService(FridaSession.FridaSession, session),
                Effect.forkChild({ startImmediately: true })
            );

            yield* Fiber.interrupt(fiber);

            const exit = yield* Fiber.await(fiber);
            assert.isTrue(Exit.hasInterrupts(exit));
            expect(yield* Deferred.isDone(interrupted)).toBe(true);
        })
    );
});
