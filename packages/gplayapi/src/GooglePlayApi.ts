/**
 * Unofficial Google Play Store API for downloading APKs directly from Google
 * Play Store.
 *
 * @since 1.0.0
 */

import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";

import * as Array from "effect/Array";
import * as Cause from "effect/Cause";
import * as Crypto from "effect/Crypto";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Match from "effect/Match";
import * as PlatformError from "effect/PlatformError";
import * as Stream from "effect/Stream";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";

import {
    BulkDetailsRequestSchema,
    type BulkDetailsResponse,
    type BuyResponse,
    type DeliveryResponse,
    type DetailsResponse,
} from "./generated/GooglePlay_pb.ts";
import { Service as AndroidDeviceService } from "./internal/device.ts";
import { decodeResponseFromResponseWrapper, encodeRequest } from "./internal/http.ts";

/** @internal */
const fdfeBase = "https://android.clients.google.com/fdfe";

export {
    /**
     * @since 1.0.0
     * @category Device
     */
    AndroidDevice,

    /**
     * @since 1.0.0
     * @category Device
     */
    Service as AndroidDeviceService,
} from "./internal/device.ts";

/**
 * @since 1.0.0
 * @category API
 */
export const details = Effect.fnUntraced(function* (
    bundleIdentifier: string
): Effect.fn.Return<
    DetailsResponse,
    HttpClientError.HttpClientError | Schema.SchemaError,
    HttpClient.HttpClient | AndroidDeviceService
> {
    const decoderDetailsResponse = decodeResponseFromResponseWrapper("detailsResponse");
    const device = yield* AndroidDeviceService;

    const httpRequest = HttpClientRequest.get("/details", {
        urlParams: { doc: bundleIdentifier },
        headers: yield* device.authHeaders,
    }).pipe(HttpClientRequest.prependUrl(fdfeBase));

    const httpResponse = yield* HttpClient.execute(httpRequest);
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
    HttpClientError.HttpClientError | Schema.SchemaError,
    HttpClient.HttpClient | AndroidDeviceService
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
    const httpResponse = yield* HttpClient.execute(pbRequest);
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
    HttpClientError.HttpClientError | Schema.SchemaError,
    HttpClient.HttpClient | AndroidDeviceService
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

    const httpResponse = yield* HttpClient.execute(httpRequest);
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
    HttpClientError.HttpClientError | Schema.SchemaError,
    HttpClient.HttpClient | AndroidDeviceService
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

    const httpResponse = yield* HttpClient.execute(httpRequest);
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
    Cause.NoSuchElementError | HttpClientError.HttpClientError | Schema.SchemaError,
    AndroidDeviceService | HttpClient.HttpClient
> {
    const { item } = yield* details(bundleIdentifier);
    const offerType = options?.offerType ?? item?.offer[0].offerType ?? 1;
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

    const main = Effect.gen(function* () {
        const integrity = Buffer.from(mainDeliveryData.sha256, "base64url").toString("hex");
        const stream = yield* HttpClient.get(mainDeliveryData.downloadUrl).pipe(
            Effect.map((response) => response.stream)
        );

        yield* Effect.logDebug(
            `fetched main APK of ${mainDeliveryData.downloadSize}bytes from ${mainDeliveryData.downloadUrl} with integrity ${integrity}(sha256)`
        );

        return {
            stream,
            name: `${bundleIdentifier}.apk`,
            url: mainDeliveryData.downloadUrl,
            size: mainDeliveryData.downloadSize,
            integrity: { "SHA-256": integrity },
        };
    });

    const splits = Array.map(mainDeliveryData.splitDeliveryData, (split) =>
        Effect.gen(function* () {
            const integrity = Buffer.from(split.sha256, "base64url").toString("hex");
            const stream = yield* HttpClient.get(split.downloadUrl).pipe(Effect.map((response) => response.stream));

            yield* Effect.logDebug(
                `fetched split ${split.name} of ${split.downloadSize}bytes from ${split.downloadUrl} with integrity ${integrity}(sha256)`
            );

            return {
                stream,
                url: split.downloadUrl,
                size: split.downloadSize,
                name: `${split.name}.apk`,
                integrity: { "SHA-256": integrity },
            };
        })
    );

    const expansions = Array.map(mainDeliveryData.additionalFile, (expansion) =>
        Effect.gen(function* () {
            const typeStr = expansion.fileType === 1 ? "main" : "patch";
            const name = `${typeStr}.${expansion.versionCode}.${bundleIdentifier}.obb`;
            const integrity = Buffer.from(expansion.sha1, "base64url").toString("hex");
            const stream = yield* HttpClient.get(expansion.downloadUrl).pipe(Effect.map((response) => response.stream));

            yield* Effect.logDebug(
                `fetched expansion file ${name} of ${expansion.size}bytes from ${expansion.downloadUrl} with integrity ${integrity}(sha1)`
            );

            return {
                name,
                stream,
                size: expansion.size,
                url: expansion.downloadUrl,
                integrity: { "SHA-1": integrity },
            };
        })
    );

    return yield* Effect.all([main, ...splits, ...expansions]);
});

/**
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
    Cause.NoSuchElementError | PlatformError.PlatformError | HttpClientError.HttpClientError | Schema.SchemaError,
    AndroidDeviceService | Crypto.Crypto | HttpClient.HttpClient | FileSystem.FileSystem | Scope.Scope
> {
    const fileSystem = yield* FileSystem.FileSystem;
    const streams = yield* downloadToStreams(bundleIdentifier, options);

    const digest =
        (algorithm: Crypto.DigestAlgorithm) =>
        <E, R>(
            stream: Stream.Stream<Uint8Array, E, R>
        ): Effect.Effect<string, E | PlatformError.PlatformError, R | Crypto.Crypto> =>
            stream.pipe(
                Stream.mkUint8Array,
                Effect.flatMap((buffer) => Crypto.Crypto.use((crypto) => crypto.digest(algorithm, buffer))),
                Effect.map((digestBuffer) =>
                    Array.fromIterable(digestBuffer)
                        .map((b) => b.toString(16).padStart(2, "0"))
                        .join("")
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
        Crypto.Crypto | Scope.Scope
    > = Effect.fnUntraced(function* ({ stream, name, url, size, integrity }) {
        const file = yield* fileSystem.makeTempFileScoped();

        const digestAlgorithm = Match.value(integrity).pipe(
            Match.when({ "SHA-1": Match.string }, () => "SHA-1" as const),
            Match.when({ "SHA-256": Match.string }, () => "SHA-256" as const),
            Match.when({ "SHA-384": Match.string }, () => "SHA-384" as const),
            Match.when({ "SHA-512": Match.string }, () => "SHA-512" as const),
            Match.exhaustive
        );

        const expectedIntegrity = (integrity as Record<Crypto.DigestAlgorithm, string>)[digestAlgorithm];
        const downloadedIntegrity = yield* stream.pipe(Stream.tapSink(fileSystem.sink(file)), digest(digestAlgorithm));

        if (downloadedIntegrity !== expectedIntegrity) {
            return yield* new PlatformError.PlatformError(
                new PlatformError.SystemError({
                    _tag: "InvalidData",
                    module: "GooglePlayApi",
                    method: "downloadToDisk",
                    description: `Downloaded ${name} integrity mismatch: expected ${integrity}, got ${downloadedIntegrity}`,
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
