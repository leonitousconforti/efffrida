/**
 * Unofficial Google Play Store API for downloading APKs directly from Google
 * Play Store.
 *
 * @since 1.0.0
 */

import type * as Array from "effect/Array";
import type * as EncodingError from "effect/encoding/EncodingError";
import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Base64Url from "effect/encoding/Base64Url";
import * as Hex from "effect/encoding/Hex";
import * as FileSystem from "effect/FileSystem";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientError from "effect/http/HttpClientError";
import * as HttpClientRequest from "effect/http/HttpClientRequest";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as PlatformError from "effect/PlatformError";
import * as Schedule from "effect/Schedule";
import * as Stream from "effect/Stream";

import type { PlayAccount, PlayAccountError } from "./PlayAccount.ts";

import { AndroidDeviceService } from "./AndroidDevice.ts";
import {
    BulkDetailsRequestSchema,
    type BulkDetailsResponse,
    type BuyResponse,
    type DeliveryResponse,
    type DetailsResponse,
} from "./generated/GooglePlay_pb.ts";
import { decodeResponseFromResponseWrapper, encodeRequest } from "./internal/http.ts";

/**
 * The expected digest of a file as lowercase hex. Expansion files are hashed
 * with SHA-1 and everything else with SHA-256.
 *
 * @since 1.0.0
 * @category Models
 */
export type Integrity = { readonly "SHA-1": string } | { readonly "SHA-256": string };

/** @internal */
const fdfeBase = "https://android.clients.google.com/fdfe";

/**
 * Backoff for transport failures, timeouts, and transient statuses (408, 429,
 * 500, 502, 503 and 504). A `Retry-After` header on the response raises the
 * delay.
 *
 * @internal
 */
const transientRetry = {
    retryOn: "errors-only",
    schedule: Schedule.exponential("500 millis"),
    times: 3,
} as const;

/**
 * Play rejects a request with a 401/403 once the credentials behind the
 * device's auth headers stop being good, which can happen well before they
 * expire on their own.
 *
 * @internal
 */
const isCredentialRejection = (error: unknown): boolean =>
    HttpClientError.isHttpClientError(error) &&
    error.reason._tag === "StatusCodeError" &&
    (error.reason.response.status === 401 || error.reason.response.status === 403);

/**
 * A client for the fdfe endpoints. Paths are resolved against the fdfe base url
 * and every request carries the device's auth headers. Non 2xx responses fail
 * instead of reaching the protobuf decoders, rejected auth headers are dropped
 * so that the next request acquires a fresh set, and transient failures are
 * retried.
 *
 * @internal
 */
const fdfeClient = Effect.gen(function* () {
    const device = yield* AndroidDeviceService;
    const httpClient = yield* HttpClient.HttpClient;

    return httpClient.pipe(
        HttpClient.mapRequest(HttpClientRequest.prependUrl(fdfeBase)),
        HttpClient.mapRequestEffect((request) =>
            Effect.map(device.authHeaders, (headers) => HttpClientRequest.setHeaders(request, headers))
        ),
        HttpClient.filterStatusOk,
        HttpClient.tapError((error) => {
            if (!isCredentialRejection(error)) {
                return Effect.void;
            }

            return Effect.andThen(
                device.invalidateAuthHeaders,
                Effect.logDebug("google play rejected the request credentials, dropping the cached auth headers")
            );
        }),
        HttpClient.retryTransient(transientRetry)
    );
});

/**
 * Fetches the store listing details of an app.
 *
 * @since 1.0.0
 * @category API
 */
export const details = Effect.fnUntraced(function* (
    bundleIdentifier: string
): Effect.fn.Return<
    DetailsResponse,
    HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
    HttpClient.HttpClient | AndroidDeviceService | PlayAccount
> {
    const httpClient = yield* fdfeClient;
    const httpResponse = yield* httpClient.get("/details", { urlParams: { doc: bundleIdentifier } });
    return yield* decodeResponseFromResponseWrapper(httpResponse, "detailsResponse");
});

/**
 * Fetches the details of an app through the bulk details endpoint.
 *
 * @since 1.0.0
 * @category API
 */
export const bulkDetails = Effect.fnUntraced(function* (
    bundleIdentifier: string
): Effect.fn.Return<
    BulkDetailsResponse,
    HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
    HttpClient.HttpClient | AndroidDeviceService | PlayAccount
> {
    const httpClient = yield* fdfeClient;
    const httpRequest = yield* encodeRequest(HttpClientRequest.post("/bulkDetails"), BulkDetailsRequestSchema, {
        includeDetails: true,
        includeChildDocs: true,
        DocId: [bundleIdentifier],
    });

    const httpResponse = yield* httpClient.execute(httpRequest);
    return yield* decodeResponseFromResponseWrapper(httpResponse, "bulkDetailsResponse");
});

/**
 * Acquires an app for the account, returning the token that `delivery` needs.
 *
 * @since 1.0.0
 * @category API
 */
export const purchase = Effect.fnUntraced(function* (
    bundleIdentifier: string,
    options: {
        offerType: number;
        versionCode: number | bigint;
        certificateHash?: string | undefined;
    }
): Effect.fn.Return<
    BuyResponse,
    HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
    HttpClient.HttpClient | AndroidDeviceService | PlayAccount
> {
    const httpClient = yield* fdfeClient;
    const httpResponse = yield* httpClient.post("/purchase", {
        urlParams: {
            doc: bundleIdentifier,
            ch: options.certificateHash ?? "",
            ot: options.offerType.toString(),
            vc: options.versionCode.toString(),
        },
    });

    return yield* decodeResponseFromResponseWrapper(httpResponse, "buyResponse");
});

/**
 * Fetches the download urls and digests of an app's APK, splits and OBBs.
 *
 * @since 1.0.0
 * @category API
 */
export const delivery = Effect.fnUntraced(function* (
    bundleIdentifier: string,
    options: {
        offerType: number;
        deliveryToken: string;
        versionCode: number | bigint;
        certificateHash?: string | undefined;
    }
): Effect.fn.Return<
    DeliveryResponse,
    HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
    HttpClient.HttpClient | AndroidDeviceService | PlayAccount
> {
    const httpClient = yield* fdfeClient;
    const httpResponse = yield* httpClient.get("/delivery", {
        urlParams: {
            doc: bundleIdentifier,
            dtok: options.deliveryToken,
            ch: options.certificateHash ?? "",
            ot: options.offerType.toString(),
            vc: options.versionCode.toString(),
        },
    });

    return yield* decodeResponseFromResponseWrapper(httpResponse, "deliveryResponse");
});

/**
 * Play encodes file digests as url safe base64, convert them to hex.
 *
 * @internal
 */
const hexFromBase64Url = (encoded: string): Effect.Effect<string, EncodingError.EncodingError, never> =>
    Effect.map(Effect.fromResult(Base64Url.decode(encoded)), Hex.encode);

/**
 * Purchases and delivers an app, returning a lazy stream per file to download.
 *
 * @since 1.0.0
 * @category API
 */
export const downloadToStreams = Effect.fnUntraced(function* (
    bundleIdentifier: string,
    options?:
        | {
              offerType?: number | undefined;
              versionCode?: number | bigint | undefined;
          }
        | undefined
): Effect.fn.Return<
    Array.NonEmptyReadonlyArray<{
        stream: Stream.Stream<Uint8Array, HttpClientError.HttpClientError, never>;
        integrity: Integrity;
        size: bigint;
        name: string;
        url: string;
    }>,
    | Cause.NoSuchElementError
    | EncodingError.EncodingError
    | HttpClientError.HttpClientError
    | Schema.SchemaError
    | PlayAccountError,
    AndroidDeviceService | HttpClient.HttpClient | PlayAccount
> {
    const { item } = yield* details(bundleIdentifier);
    const offerType = options?.offerType ?? item?.offer[0]?.offerType ?? 1;
    const versionCode = options?.versionCode ?? item?.details?.appDetails?.versionCode ?? 0;

    const { encodedDeliveryToken } = yield* purchase(bundleIdentifier, {
        offerType: offerType,
        versionCode: versionCode,
    });

    const deliveryResult = yield* delivery(bundleIdentifier, {
        deliveryToken: encodedDeliveryToken,
        offerType: offerType,
        versionCode: versionCode,
    });

    const mainDeliveryData = deliveryResult?.appDeliveryData;
    if (mainDeliveryData === undefined) {
        return yield* new Cause.NoSuchElementError();
    }

    // Each request is only made once its stream is run, so that downloads
    // happen one at a time as the caller drains them.
    const httpClient = (yield* HttpClient.HttpClient).pipe(
        HttpClient.filterStatusOk,
        HttpClient.retryTransient(transientRetry)
    );
    const download = (url: string, description: string) =>
        HttpClientResponse.stream(
            httpClient.get(url).pipe(Effect.tap(() => Effect.logDebug(`downloading ${description} from ${url}`)))
        );

    const mainIntegrity = yield* hexFromBase64Url(mainDeliveryData.sha256);
    const main = {
        name: `${bundleIdentifier}.apk`,
        url: mainDeliveryData.downloadUrl,
        size: mainDeliveryData.downloadSize,
        integrity: { "SHA-256": mainIntegrity },
        stream: download(
            mainDeliveryData.downloadUrl,
            `main APK of ${mainDeliveryData.downloadSize}bytes with integrity ${mainIntegrity}(sha256)`
        ),
    };

    const splits = yield* Effect.forEach(mainDeliveryData.splitDeliveryData, (split) =>
        Effect.map(hexFromBase64Url(split.sha256), (integrity) => ({
            url: split.downloadUrl,
            size: split.downloadSize,
            name: `${split.name}.apk`,
            integrity: { "SHA-256": integrity },
            stream: download(
                split.downloadUrl,
                `split ${split.name} of ${split.downloadSize}bytes with integrity ${integrity}(sha256)`
            ),
        }))
    );

    const expansions = yield* Effect.forEach(mainDeliveryData.additionalFile, (expansion) => {
        const typeStr = expansion.fileType === 0 ? "main" : "patch";
        const name = `${typeStr}.${expansion.versionCode}.${bundleIdentifier}.obb`;
        return Effect.map(hexFromBase64Url(expansion.sha1), (integrity) => ({
            name,
            size: expansion.size,
            url: expansion.downloadUrl,
            integrity: { "SHA-1": integrity },
            stream: download(
                expansion.downloadUrl,
                `expansion file ${name} of ${expansion.size}bytes with integrity ${integrity}(sha1)`
            ),
        }));
    });

    return [main, ...splits, ...expansions];
});

/**
 * Downloads the APK, its splits, and its expansion files into temporary files
 * and checks each against its expected integrity. Files are hashed as they are
 * streamed to disk, so they are never held in memory in full.
 *
 * The temporary files are created with `FileSystem.makeTempFileScoped`, so they
 * are deleted when the provided `Scope` closes. Copy or move them somewhere
 * else first if they need to outlive it. A file that fails its integrity check
 * fails the effect, and any files written so far are removed along with the
 * scope.
 *
 * @since 1.0.0
 * @category API
 */
export const downloadToDisk = Effect.fnUntraced(function* (
    bundleIdentifier: string,
    options?:
        | {
              offerType?: number | undefined;
              versionCode?: number | bigint | undefined;
          }
        | undefined
): Effect.fn.Return<
    Array.NonEmptyReadonlyArray<{
        url: string;
        name: string;
        file: string;
        size: bigint;
        integrity: Integrity;
    }>,
    | Cause.NoSuchElementError
    | EncodingError.EncodingError
    | PlatformError.PlatformError
    | HttpClientError.HttpClientError
    | Schema.SchemaError
    | PlayAccountError,
    AndroidDeviceService | PlayAccount | HttpClient.HttpClient | FileSystem.FileSystem | Scope.Scope
> {
    const fileSystem = yield* FileSystem.FileSystem;
    const streams = yield* downloadToStreams(bundleIdentifier, options);
    const { createHash } = yield* Effect.promise(() => import("node:crypto"));

    const write = Effect.fnUntraced(function* ({ stream, name, url, size, integrity }: (typeof streams)[number]) {
        const file = yield* fileSystem.makeTempFileScoped({ suffix: name.slice(name.lastIndexOf(".")) });

        const [algorithm, expectedIntegrity] =
            "SHA-1" in integrity
                ? (["sha1", integrity["SHA-1"]] as const)
                : (["sha256", integrity["SHA-256"]] as const);

        const hash = createHash(algorithm);
        yield* stream.pipe(
            Stream.tap((chunk) => Effect.sync(() => hash.update(chunk))),
            Stream.run(fileSystem.sink(file))
        );

        const downloadedIntegrity = hash.digest("hex");
        if (downloadedIntegrity !== expectedIntegrity) {
            return yield* new PlatformError.PlatformError(
                new PlatformError.SystemError({
                    _tag: "InvalidData",
                    module: "GooglePlayApi",
                    method: "downloadToDisk",
                    description: `Downloaded ${name} integrity mismatch: expected ${expectedIntegrity}, got ${downloadedIntegrity}`,
                })
            );
        }

        return {
            url,
            name,
            file,
            size,
            integrity,
        };
    });

    return yield* Effect.forEach(streams, write);
});
