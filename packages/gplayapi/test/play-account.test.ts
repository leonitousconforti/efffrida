import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Inspectable from "effect/Inspectable";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

import { assert, describe, it } from "@effect/vitest";
import { PlayAccount } from "@efffrida/gplayapi";

import { dispenserResponse, mockHttpClient } from "./utils.ts";

const notFound = (): Response => new Response(null, { status: 404 });

describe("PlayAccount.layerStatic", () => {
    it.effect("hands back the credentials it was given", () => {
        const credentials = { email: "static@example.com", token: Redacted.make("static-token") };

        return Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const resolved = yield* account.credentials;
            assert.strictEqual(resolved.email, "static@example.com");
            assert.strictEqual(Redacted.value(resolved.token), "static-token");
        }).pipe(Effect.provide(PlayAccount.layerStatic(credentials)));
    });
});

describe("PlayAccount.layerAuroraDispenser", () => {
    it.effect("asks the default dispenser with the aurora store user agent", () => {
        const http = mockHttpClient((request) =>
            request.url === PlayAccount.defaultAuroraDispenserUrl
                ? dispenserResponse({ email: "anon@example.com", auth: "dispensed-token" })
                : notFound()
        );

        return Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const resolved = yield* account.credentials;

            assert.strictEqual(resolved.email, "anon@example.com");
            assert.strictEqual(Redacted.value(resolved.token), "dispensed-token");

            assert.strictEqual(http.requests.length, 1);
            assert.strictEqual(http.requests[0].method, "GET");
            assert.strictEqual(http.requests[0].url, "https://auroraoss.com/api/auth");
            assert.strictEqual(http.requests[0].headers["user-agent"], "com.aurora.store-4.7.5-71");
            assert.strictEqual(http.requests[0].headers["accept"], "application/json");
        }).pipe(Effect.provide(PlayAccount.layerAuroraDispenser().pipe(Layer.provide(http.layer))));
    });

    it.effect("honours a dispenser url override", () => {
        const url = "https://dispenser.internal/api/auth";
        const http = mockHttpClient((request) =>
            request.url === url ? dispenserResponse({ email: "anon@example.com", auth: "dispensed-token" }) : notFound()
        );

        return Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            yield* account.credentials;
            assert.deepStrictEqual(
                http.requests.map((request) => request.url),
                [url]
            );
        }).pipe(Effect.provide(PlayAccount.layerAuroraDispenser(url).pipe(Layer.provide(http.layer))));
    });

    it.effect("surfaces a malformed dispenser payload as a PlayAccountError", () => {
        const http = mockHttpClient(() => dispenserResponse({ email: 42 }));

        return Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const error = yield* Effect.flip(account.credentials);
            assert.strictEqual(error._tag, "PlayAccountError");
            assert.strictEqual(error.strategy, "aurora-dispenser");
        }).pipe(Effect.provide(PlayAccount.layerAuroraDispenser().pipe(Layer.provide(http.layer))));
    });

    it.effect("surfaces a rejected dispenser request as a PlayAccountError", () => {
        const http = mockHttpClient(() => new Response(null, { status: 429 }));

        return Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const error = yield* Effect.flip(account.credentials);
            assert.strictEqual(error._tag, "PlayAccountError");
            assert.strictEqual(error.strategy, "aurora-dispenser");
        }).pipe(Effect.provide(PlayAccount.layerAuroraDispenser().pipe(Layer.provide(http.layer))));
    });
});

describe("PlayAccount.layerConfig", () => {
    const provider = ConfigProvider.fromEnv({
        env: { GPLAY_EMAIL: "config@example.com", GPLAY_AUTH_TOKEN: "config-token-value" },
    });

    it.effect("reads GPLAY_EMAIL and GPLAY_AUTH_TOKEN by default", () =>
        Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const resolved = yield* account.credentials;
            assert.strictEqual(resolved.email, "config@example.com");
            assert.strictEqual(Redacted.value(resolved.token), "config-token-value");
        }).pipe(
            Effect.provide(PlayAccount.layerConfig()),
            Effect.provideService(ConfigProvider.ConfigProvider, provider)
        )
    );

    it.effect("keeps the token redacted", () =>
        Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const resolved = yield* account.credentials;
            assert.isTrue(Redacted.isRedacted(resolved.token));
            assert.strictEqual(Inspectable.toStringUnknown(resolved.token), `"<redacted>"`);
            assert.isFalse(Inspectable.toStringUnknown(resolved).includes("config-token-value"));
        }).pipe(
            Effect.provide(PlayAccount.layerConfig()),
            Effect.provideService(ConfigProvider.ConfigProvider, provider)
        )
    );

    it.effect("accepts custom configs", () =>
        Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const resolved = yield* account.credentials;
            assert.strictEqual(resolved.email, "custom@example.com");
            assert.strictEqual(Redacted.value(resolved.token), "custom-token-value");
        }).pipe(
            Effect.provide(
                PlayAccount.layerConfig({
                    email: Config.string("PLAY_EMAIL"),
                    token: Config.redacted("PLAY_TOKEN"),
                })
            ),
            Effect.provideService(
                ConfigProvider.ConfigProvider,
                ConfigProvider.fromEnv({
                    env: { PLAY_EMAIL: "custom@example.com", PLAY_TOKEN: "custom-token-value" },
                })
            )
        )
    );

    it.effect("surfaces missing configuration as a PlayAccountError", () =>
        Effect.gen(function* () {
            const account = yield* PlayAccount.PlayAccount;
            const error = yield* Effect.flip(account.credentials);
            assert.strictEqual(error._tag, "PlayAccountError");
            assert.strictEqual(error.strategy, "config");
        }).pipe(
            Effect.provide(PlayAccount.layerConfig()),
            Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromEnv({ env: {} }))
        )
    );
});
