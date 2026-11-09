import { Effect, Fiber, Layer } from "effect";
import { RpcClient, RpcClientError, RpcSerialization } from "effect/rpc";

import { NodeServices } from "@effect/platform-node";
import { assert, describe, expect, it } from "@effect/vitest";
import { FridaDevice, FridaScript, FridaSession, FridaSessionError } from "@efffrida/frida-tools";
import { FridaRpcClient } from "@efffrida/rpc/node";
import { JsPlatform } from "frida";

import { DetachRpcs } from "../../shared/requests.ts";

const SessionLive =
    process.env.CI !== undefined
        ? FridaSession.layer(["/usr/bin/sleep", "infinity"])
        : FridaSession.SessionLive({ preSpawn: true, spawn: ["sleep", "infinity"] });

// Every test detaches its session, so each one gets its own, which takes a
// spawn and a compile
const Live = FridaRpcClient.layerProtocolFrida().pipe(
    Layer.provide(RpcSerialization.layerNdjson),
    Layer.provideMerge(
        FridaScript.layer(new URL("../../frida/server/detach.agent.ts", import.meta.url), {
            platform: JsPlatform.Browser,
        })
    ),
    Layer.provideMerge(SessionLive),
    Layer.provide(Layer.merge(FridaDevice.layerLocalDevice, NodeServices.layer))
);

const timeout = 30_000;

const detach = Effect.flatMap(FridaSession.FridaSession, ({ session }) => Effect.promise(() => session.detach()));

const expectDetached = (error: unknown) => {
    assert.instanceOf(error, RpcClientError.RpcClientError);
    assert.instanceOf(error.reason.cause, FridaSessionError.FridaSessionError);
    expect(error.reason.cause.when).toBe("detached");
};

describe("a client whose session detaches", () => {
    it.live(
        "fails calls that were running with the FridaSessionError as the cause",
        () =>
            Effect.gen(function* () {
                const client = yield* RpcClient.make(DetachRpcs);
                const fiber = yield* Effect.forkChild(client.Hang(), { startImmediately: true });
                expect(yield* client.Ping()).toBe("pong");
                yield* detach;
                expectDetached(yield* Effect.flip(Fiber.join(fiber)));
            }).pipe(Effect.provide(Live)),
        timeout
    );

    it.live(
        "fails calls made after the detach with the FridaSessionError as the cause",
        () =>
            Effect.gen(function* () {
                const client = yield* RpcClient.make(DetachRpcs);
                expect(yield* client.Ping()).toBe("pong");
                yield* detach;
                expectDetached(yield* Effect.flip(client.Ping()));
            }).pipe(Effect.provide(Live)),
        timeout
    );
});
