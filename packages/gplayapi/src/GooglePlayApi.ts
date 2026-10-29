/**
 * Unofficial Google Play Store API for downloading APKs directly from Google
 * Play Store.
 *
 * @since 1.0.0
 */

import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";

import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Digest from "effect/crypto/Digest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientError from "effect/http/HttpClientError";
import * as HttpClientRequest from "effect/http/HttpClientRequest";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as Match from "effect/Match";
import * as PlatformError from "effect/PlatformError";
import * as Stream from "effect/Stream";

import type { PlayAccount, PlayAccountError } from "./PlayAccount.ts";

import { type AndroidDevice, AndroidDeviceService } from "./AndroidDevice.ts";
import {
    BulkDetailsRequestSchema,
    type BulkDetailsResponse,
    type BuyResponse,
    type DeliveryResponse,
    type DetailsResponse,
} from "./generated/GooglePlay_pb.ts";
import { decodeResponseFromResponseWrapper, encodeRequest } from "./internal/http.ts";

/** @internal */
const fdfeBase = "https://android.clients.google.com/fdfe";

/**
 * Play rejects a request with a 401/403 once the credentials behind the
 * device's auth headers stop being good, which can happen well before they
 * expire on their own. Drop them so the next call acquires a fresh set, and
 * report the rejection instead of handing a body that is not a protobuf
 * payload to the caller's decoder.
 *
 * @internal
 */
const evictRejectedAuthHeaders =
    (device: AndroidDevice) =>
    <E, R>(
        self: Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>
    ): Effect.Effect<HttpClientResponse.HttpClientResponse, E | HttpClientError.HttpClientError, R> =>
        Effect.flatMap(self, (response) => {
            if (response.status !== 401 && response.status !== 403) {
                return Effect.succeed(response);
            }

            device.invalidateAuthHeaders();
            return Effect.andThen(
                Effect.logDebug(`google play answered ${response.status}, dropping the cached auth headers`),
                new HttpClientError.HttpClientError({
                    reason: new HttpClientError.StatusCodeError({
                        request: response.request,
                        response,
                        description: "google play rejected the request credentials",
                    }),
                })
            );
        });

/**
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
    const decoderDetailsResponse = decodeResponseFromResponseWrapper("detailsResponse");
    const device = yield* AndroidDeviceService;

    const httpRequest = HttpClientRequest.get("/details", {
        urlParams: { doc: bundleIdentifier },
        headers: yield* device.authHeaders,
    }).pipe(HttpClientRequest.prependUrl(fdfeBase));

    const httpResponse = yield* HttpClient.execute(httpRequest).pipe(evictRejectedAuthHeaders(device));
    const pbResponse = yield* decoderDetailsResponse(httpResponse);
    return pbResponse;
});

/**
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
    const decoderBulkDetailsResponse = decodeResponseFromResponseWrapper("bulkDetailsResponse");
    const encoderBulkDetailsRequest = encodeRequest(BulkDetailsRequestSchema, {
        includeDetails: true,
        includeChildDocs: true,
        DocId: [bundleIdentifier],
    });

    const device = yield* AndroidDeviceService;
    const httpRequest = HttpClientRequest.post("/bulkDetails", {
        headers: yield* device.authHeaders,
    }).pipe(HttpClientRequest.prependUrl(fdfeBase));

    const pbRequest = yield* encoderBulkDetailsRequest(httpRequest);
    const httpResponse = yield* HttpClient.execute(pbRequest).pipe(evictRejectedAuthHeaders(device));
    const pbResponse = yield* decoderBulkDetailsResponse(httpResponse);
    return pbResponse;
});

/**
 * @since 1.0.0
 * @category API
 */
export const purchase = Effect.fnUntraced(function* (
    bundleIdentifier: string,
    options: { offerType: number; versionCode: number | bigint; certificateHash?: string }
): Effect.fn.Return<
    BuyResponse,
    HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
    HttpClient.HttpClient | AndroidDeviceService | PlayAccount
> {
    const decoderBuyResponse = decodeResponseFromResponseWrapper("buyResponse");

    const device = yield* AndroidDeviceService;
    const httpRequest = HttpClientRequest.post("/purchase", {
        headers: yield* device.authHeaders,
        urlParams: {
            doc: bundleIdentifier,
            ch: options.certificateHash ?? "",
            ot: options.offerType.toString(),
            vc: options.versionCode.toString(),
        },
    }).pipe(HttpClientRequest.prependUrl(fdfeBase));

    const httpResponse = yield* HttpClient.execute(httpRequest).pipe(evictRejectedAuthHeaders(device));
    const pbResponse = yield* decoderBuyResponse(httpResponse);
    return pbResponse;
});

/**
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
    const decoderDeliveryResponse = decodeResponseFromResponseWrapper("deliveryResponse");

    const device = yield* AndroidDeviceService;
    const httpRequest = HttpClientRequest.get("/delivery", {
        headers: yield* device.authHeaders,
        urlParams: {
            doc: bundleIdentifier,
            dtok: options.deliveryToken,
            ch: options.certificateHash ?? "",
            ot: options.offerType.toString(),
            vc: options.versionCode.toString(),
        },
    }).pipe(HttpClientRequest.prependUrl(fdfeBase));

    const httpResponse = yield* HttpClient.execute(httpRequest).pipe(evictRejectedAuthHeaders(device));
    const pbResponse = yield* decoderDeliveryResponse(httpResponse);
    return pbResponse;
});

/**
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
        integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string };
        size: bigint;
        name: string;
        url: string;
    }>,
    Cause.NoSuchElementError | HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
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
    const httpClient = HttpClient.filterStatusOk(yield* HttpClient.HttpClient);
    const download = (url: string, description: string) =>
        HttpClientResponse.stream(
            httpClient.get(url).pipe(Effect.tap(() => Effect.logDebug(`downloading ${description} from ${url}`)))
        );

    const mainIntegrity = Buffer.from(mainDeliveryData.sha256, "base64url").toString("hex");
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

    const splits = Array.map(mainDeliveryData.splitDeliveryData, (split) => {
        const integrity = Buffer.from(split.sha256, "base64url").toString("hex");
        return {
            url: split.downloadUrl,
            size: split.downloadSize,
            name: `${split.name}.apk`,
            integrity: { "SHA-256": integrity },
            stream: download(
                split.downloadUrl,
                `split ${split.name} of ${split.downloadSize}bytes with integrity ${integrity}(sha256)`
            ),
        };
    });

    const expansions = Array.map(mainDeliveryData.additionalFile, (expansion) => {
        const typeStr = expansion.fileType === 1 ? "main" : "patch";
        const name = `${typeStr}.${expansion.versionCode}.${bundleIdentifier}.obb`;
        const integrity = Buffer.from(expansion.sha1, "base64url").toString("hex");
        return {
            name,
            size: expansion.size,
            url: expansion.downloadUrl,
            integrity: { "SHA-1": integrity },
            stream: download(
                expansion.downloadUrl,
                `expansion file ${name} of ${expansion.size}bytes with integrity ${integrity}(sha1)`
            ),
        };
    });

    return [main, ...splits, ...expansions];
});

/**
 * Note that each file is buffered in memory in full while its integrity is
 * hashed, so peak memory use is the size of the largest file (expansion files
 * can be several gigabytes).
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
        integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string };
    }>,
    | Cause.NoSuchElementError
    | PlatformError.PlatformError
    | HttpClientError.HttpClientError
    | Schema.SchemaError
    | PlayAccountError,
    AndroidDeviceService | PlayAccount | Digest.Digest | HttpClient.HttpClient | FileSystem.FileSystem | Scope.Scope
> {
    const fileSystem = yield* FileSystem.FileSystem;
    const streams = yield* downloadToStreams(bundleIdentifier, options);

    const digestAlgorithms = {
        "SHA-1": Digest.sha1,
        "SHA-256": Digest.sha256,
        "SHA-384": Digest.sha384,
        "SHA-512": Digest.sha512,
    } as const;

    const digest =
        (algorithm: keyof typeof digestAlgorithms) =>
        <E, R>(stream: Stream.Stream<Uint8Array, E, R>): Effect.Effect<string, E, R | Digest.Digest> =>
            stream.pipe(
                Stream.mkUint8Array,
                Effect.flatMap((buffer) =>
                    Digest.Digest.use((digest) => digest.digestHex(digestAlgorithms[algorithm], buffer))
                )
            );

    const write: (stream: (typeof streams)[number]) => Effect.Effect<
        {
            url: string;
            name: string;
            file: string;
            size: bigint;
            integrity: { "SHA-1": string } | { "SHA-256": string } | { "SHA-384": string } | { "SHA-512": string };
        },
        PlatformError.PlatformError | HttpClientError.HttpClientError,
        Digest.Digest | Scope.Scope
    > = Effect.fnUntraced(function* ({ stream, name, url, size, integrity }) {
        const file = yield* fileSystem.makeTempFileScoped({ suffix: name.slice(name.lastIndexOf(".")) });

        const digestAlgorithm = Match.value(integrity).pipe(
            Match.when({ "SHA-1": Match.string }, () => "SHA-1" as const),
            Match.when({ "SHA-256": Match.string }, () => "SHA-256" as const),
            Match.when({ "SHA-384": Match.string }, () => "SHA-384" as const),
            Match.when({ "SHA-512": Match.string }, () => "SHA-512" as const),
            Match.exhaustive
        );

        const expectedIntegrity = (integrity as Record<keyof typeof digestAlgorithms, string>)[digestAlgorithm];
        const downloadedIntegrity = yield* stream.pipe(Stream.tapSink(fileSystem.sink(file)), digest(digestAlgorithm));

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

    const effects = Array.map(streams, write);
    return yield* Effect.all(effects);
});
