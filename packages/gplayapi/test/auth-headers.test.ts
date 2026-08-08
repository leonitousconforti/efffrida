import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as HttpClientError from "effect/unstable/http/HttpClientError";

import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { GooglePlayApi, PlayAccount } from "@efffrida/gplayapi";

import {
    androidId,
    checkinResponse,
    countRequests,
    detailsResponse,
    detailsStreamUrl,
    deviceCheckinConsistencyToken,
    dispenserResponse,
    mockHttpClient,
    type RecordedRequest,
    uploadDeviceConfigResponse,
    uploadDeviceConfigToken,
} from "./utils.ts";

const bundleIdentifier = "com.nimblebit.tinytower";

/** A fresh device per test, so that the auth header cache is never shared. */
const deviceLayer = () =>
    GooglePlayApi.AndroidDevice.EmbeddedPixel7aLive.pipe(Layer.provide(NodeServices.layer), Layer.fresh);

/** Answers the two google endpoints that acquiring auth headers talks to. */
const respondToCheckin = (request: RecordedRequest): Response | undefined => {
    if (request.url.includes("/checkin")) return checkinResponse();
    if (request.url.includes("/uploadDeviceConfig")) return uploadDeviceConfigResponse();
    return undefined;
};

describe("AndroidDevice.authHeaders", () => {
    it.effect("authorizes with the token the PlayAccount service hands out", () => {
        const http = mockHttpClient((request) => respondToCheckin(request) ?? new Response(null, { status: 404 }));

        const credentials = { email: "static@example.com", token: Redacted.make("static-token") };
        const layers = Layer.mergeAll(deviceLayer(), http.layer, PlayAccount.layerStatic(credentials));

        return Effect.gen(function* () {
            const device = yield* GooglePlayApi.AndroidDeviceService;
            const headers = yield* device.authHeaders;

            assert.strictEqual(headers["Authorization"], "Bearer static-token");
            assert.strictEqual(headers["X-DFE-Device-Id"], androidId.toString(16));
            assert.strictEqual(headers["X-DFE-Device-Checkin-Consistency-Token"], deviceCheckinConsistencyToken);
            assert.strictEqual(headers["X-DFE-Device-Config-Token"], uploadDeviceConfigToken);

            // Nothing reached the aurora dispenser.
            assert.strictEqual(countRequests(http.requests, "auroraoss.com"), 0);
        }).pipe(Effect.provide(layers));
    });

    it.effect("caches the headers until they are invalidated", () => {
        const http = mockHttpClient((request) => respondToCheckin(request) ?? new Response(null, { status: 404 }));

        const credentials = { email: "static@example.com", token: Redacted.make("static-token") };
        const layers = Layer.mergeAll(deviceLayer(), http.layer, PlayAccount.layerStatic(credentials));

        return Effect.gen(function* () {
            const device = yield* GooglePlayApi.AndroidDeviceService;

            yield* device.authHeaders;
            yield* device.authHeaders;
            assert.strictEqual(countRequests(http.requests, "/checkin"), 1);

            device.invalidateAuthHeaders();
            yield* device.authHeaders;
            assert.strictEqual(countRequests(http.requests, "/checkin"), 2);
        }).pipe(Effect.provide(layers));
    });
});

describe("GooglePlayApi auth retry", () => {
    it.effect("reacquires credentials once when play answers 401", () => {
        let detailsCalls = 0;

        const http = mockHttpClient((request) => {
            if (request.url.includes("/api/auth")) {
                return dispenserResponse({ email: "anon@example.com", auth: `dispensed-${detailsCalls}` });
            }

            const checkin = respondToCheckin(request);
            if (checkin !== undefined) return checkin;

            if (request.url.includes("/fdfe/details")) {
                detailsCalls += 1;
                return detailsCalls === 1 ? new Response(null, { status: 401 }) : detailsResponse();
            }

            return new Response(null, { status: 404 });
        });

        const layers = Layer.mergeAll(
            deviceLayer(),
            http.layer,
            PlayAccount.layerAuroraDispenser().pipe(Layer.provide(http.layer))
        );

        return Effect.gen(function* () {
            const response = yield* GooglePlayApi.details(bundleIdentifier);
            assert.strictEqual(response.detailsStreamUrl, detailsStreamUrl);

            // Exactly one retry, and the retry went through a full reacquisition.
            assert.strictEqual(countRequests(http.requests, "/fdfe/details"), 2);
            assert.strictEqual(countRequests(http.requests, "/api/auth"), 2);
            assert.strictEqual(countRequests(http.requests, "/checkin"), 2);
        }).pipe(Effect.provide(layers));
    });

    it.effect("gives up after a second 401", () => {
        const http = mockHttpClient((request) => {
            if (request.url.includes("/api/auth")) {
                return dispenserResponse({ email: "anon@example.com", auth: "dispensed-token" });
            }

            const checkin = respondToCheckin(request);
            if (checkin !== undefined) return checkin;

            if (request.url.includes("/fdfe/details")) return new Response(null, { status: 401 });
            return new Response(null, { status: 404 });
        });

        const layers = Layer.mergeAll(
            deviceLayer(),
            http.layer,
            PlayAccount.layerAuroraDispenser().pipe(Layer.provide(http.layer))
        );

        return Effect.gen(function* () {
            const error = yield* Effect.flip(GooglePlayApi.details(bundleIdentifier));

            assert.instanceOf(error, HttpClientError.HttpClientError);
            assert.strictEqual(error.reason._tag, "StatusCodeError");
            assert.strictEqual(countRequests(http.requests, "/fdfe/details"), 2);
        }).pipe(Effect.provide(layers));
    });

    it.effect("leaves other failing statuses alone", () => {
        const http = mockHttpClient((request) => {
            const checkin = respondToCheckin(request);
            if (checkin !== undefined) return checkin;
            return new Response(null, { status: 500 });
        });

        const credentials = { email: "static@example.com", token: Redacted.make("static-token") };
        const layers = Layer.mergeAll(deviceLayer(), http.layer, PlayAccount.layerStatic(credentials));

        return Effect.gen(function* () {
            yield* Effect.flip(GooglePlayApi.details(bundleIdentifier));
            assert.strictEqual(countRequests(http.requests, "/fdfe/details"), 1);
        }).pipe(Effect.provide(layers));
    });
});
