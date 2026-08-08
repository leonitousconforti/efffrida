/**
 * Google play account credentials.
 *
 * @since 1.0.0
 */

import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as Schema from "effect/Schema";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

/**
 * The strategy that was used when acquiring the credentials failed.
 *
 * @since 1.0.0
 * @category Models
 */
export type PlayAccountStrategy = "aurora-dispenser" | "config";

/**
 * @since 1.0.0
 * @category Errors
 */
export class PlayAccountError extends Data.TaggedError("PlayAccountError")<{
    readonly strategy: PlayAccountStrategy;
    readonly cause: unknown;
}> {
    public override get message(): string {
        return `Failed to acquire google play credentials with the ${this.strategy} strategy`;
    }
}

/**
 * The credentials that the google play endpoints are authenticated with.
 *
 * @since 1.0.0
 * @category Models
 */
export interface PlayCredentials {
    readonly email: string;
    readonly token: Redacted.Redacted<string>;
}

/**
 * Holds an effect that yields credentials rather than the credentials
 * themselves, so that re-running it re-executes the acquisition strategy. That
 * is what makes invalidating cached auth headers meaningful.
 *
 * @since 1.0.0
 * @category Models
 */
export interface PlayAccountService {
    readonly credentials: Effect.Effect<PlayCredentials, PlayAccountError, never>;
}

/**
 * @since 1.0.0
 * @category Tags
 */
export class PlayAccount extends Context.Service<PlayAccount, PlayAccountService>()("@efffrida/gplayapi/PlayAccount") {}

/**
 * The anonymous account dispenser that the Aurora store uses.
 *
 * @since 1.0.0
 * @category Constants
 */
export const defaultAuroraDispenserUrl: string = "https://auroraoss.com/api/auth";

/** @internal */
const AuroraDispenserResponse = Schema.Struct({
    email: Schema.String,
    auth: Schema.String,
});

/**
 * Dispenses anonymous credentials from an Aurora store compatible dispenser.
 * Note that the hosted dispenser blocks/rate limits datacenter ip ranges, so
 * this layer is a poor fit for anything running on cloud infrastructure.
 *
 * @since 1.0.0
 * @category Layers
 */
export const layerAuroraDispenser = (
    url: string = defaultAuroraDispenserUrl
): Layer.Layer<PlayAccount, never, HttpClient.HttpClient> =>
    Layer.effect(
        PlayAccount,
        Effect.map(HttpClient.HttpClient, (httpClient) => {
            //  curl \
            //      --request GET \
            //      --header "Accept: application/json" \
            //      --header "User-Agent: com.aurora.store-4.7.5-71" \
            //      "https://auroraoss.com/api/auth"
            const credentials = Function.pipe(
                HttpClientRequest.get(url),
                HttpClientRequest.setHeader("User-Agent", "com.aurora.store-4.7.5-71"),
                HttpClientRequest.acceptJson,
                (request) => httpClient.execute(request),
                Effect.flatMap(HttpClientResponse.filterStatusOk),
                Effect.flatMap(HttpClientResponse.schemaBodyJson(AuroraDispenserResponse)),
                Effect.map(({ auth, email }) => ({ email, token: Redacted.make(auth) })),
                Effect.catch((cause) => new PlayAccountError({ strategy: "aurora-dispenser", cause }))
            );

            return { credentials };
        })
    );

/**
 * Reads credentials that were obtained out of band from the config provider,
 * defaulting to the `GPLAY_EMAIL` and `GPLAY_AUTH_TOKEN` environment
 * variables.
 *
 * @since 1.0.0
 * @category Layers
 */
export const layerConfig = (
    options?:
        | {
              email?: Config.Config<string> | undefined;
              token?: Config.Config<Redacted.Redacted<string>> | undefined;
          }
        | undefined
): Layer.Layer<PlayAccount, never, never> => {
    const credentials = Effect.all({
        email: options?.email ?? Config.string("GPLAY_EMAIL"),
        token: options?.token ?? Config.redacted("GPLAY_AUTH_TOKEN"),
    }).pipe(Effect.catch((cause) => new PlayAccountError({ strategy: "config", cause })));

    return Layer.succeed(PlayAccount, { credentials });
};

/**
 * Serves credentials that are already in hand, which is mostly useful for
 * tests and for applications that fetch their token out of band.
 *
 * @since 1.0.0
 * @category Layers
 */
export const layerStatic = (credentials: PlayCredentials): Layer.Layer<PlayAccount, never, never> =>
    Layer.succeed(PlayAccount, { credentials: Effect.succeed(credentials) });
