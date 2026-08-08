/**
 * A `PlayAccount` layer is deliberately not bundled with the device layers, so
 * leaving it out has to be a compile error rather than a runtime surprise.
 *
 * @effect-diagnostics missingEffectContext:off
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { GooglePlayApi, PlayAccount } from "@efffrida/gplayapi";

import { mockHttpClient } from "./utils.ts";

/** Only accepts programs whose requirements have all been provided. */
const fullyProvided = <A, E>(effect: Effect.Effect<A, E, never>): void => void effect;

describe("GooglePlayApi requirements", () => {
    it("needs a PlayAccount layer", () => {
        const http = mockHttpClient(() => new Response(null, { status: 404 }));
        const device = GooglePlayApi.AndroidDevice.EmbeddedPixel7aLive.pipe(Layer.provide(NodeServices.layer));
        const withoutAccount = Layer.merge(device, http.layer);
        const credentials = { email: "static@example.com", token: Redacted.make("static-token") };

        // @ts-expect-error the PlayAccount service has not been provided
        fullyProvided(Effect.provide(GooglePlayApi.details("com.nimblebit.tinytower"), withoutAccount));

        fullyProvided(
            Effect.provide(
                GooglePlayApi.details("com.nimblebit.tinytower"),
                Layer.merge(withoutAccount, PlayAccount.layerStatic(credentials))
            )
        );

        // Building the programs above is pure, nothing was executed.
        assert.strictEqual(http.requests.length, 0);
    });
});
