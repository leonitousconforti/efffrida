/**
 * Unofficial Google Play Store API for downloading APKs directly from Google
 * Play Store.
 *
 * @since 1.0.0
 */

import type * as PlatformError from "effect/PlatformError";
import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";

import * as Array from "effect/Array";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Function from "effect/Function";
import * as Stream from "effect/Stream";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

import type { AndroidDevice } from "./internal/device.ts";

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

export {
    /**
     * @since 1.0.0
     * @category Device
     */
    AndroidDevice,
} from "./internal/device.ts";

/**
 * @since 1.0.0
 * @category API
 */
export const details = Function.dual<
    (
        device: AndroidDevice
    ) => (
        bundleIdentifier: string
    ) => Effect.Effect<DetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>,
    (
        bundleIdentifier: string,
        device: AndroidDevice
    ) => Effect.Effect<DetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>
>(
    2,
    Effect.fnUntraced(function* (bundleIdentifier: string, device: AndroidDevice) {
        const decoderDetailsResponse = decodeResponseFromResponseWrapper("detailsResponse");
        const httpRequest = HttpClientRequest.get("/details", {
            urlParams: { doc: bundleIdentifier },
            headers: yield* device.authHeaders,
        }).pipe(HttpClientRequest.prependUrl(fdfeBase));

        const httpResponse = yield* HttpClient.execute(httpRequest);
        const pbResponse = yield* decoderDetailsResponse(httpResponse);
        return pbResponse;
    })
);

/**
 * @since 1.0.0
 * @category API
 */
export const bulkDetails = Function.dual<
    (
        device: AndroidDevice
    ) => (
        bundleIdentifier: string
    ) => Effect.Effect<
        BulkDetailsResponse,
        HttpClientError.HttpClientError | Schema.SchemaError,
        HttpClient.HttpClient
    >,
    (
        bundleIdentifier: string,
        device: AndroidDevice
    ) => Effect.Effect<BulkDetailsResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>
>(
    2,
    Effect.fnUntraced(function* (bundleIdentifier: string, device: AndroidDevice) {
        const decoderBulkDetailsResponse = decodeResponseFromResponseWrapper("bulkDetailsResponse");
        const encoderBulkDetailsRequest = encodeRequest(BulkDetailsRequestSchema, {
            includeDetails: true,
            includeChildDocs: true,
            DocId: [bundleIdentifier],
        });

        const httpRequest = HttpClientRequest.post("/bulkDetails", {
            headers: yield* device.authHeaders,
        }).pipe(HttpClientRequest.prependUrl(fdfeBase));

        const pbRequest = yield* encoderBulkDetailsRequest(httpRequest);
        const httpResponse = yield* HttpClient.execute(pbRequest);
        const pbResponse = yield* decoderBulkDetailsResponse(httpResponse);
        return pbResponse;
    })
);

/**
 * @since 1.0.0
 * @category API
 */
export const purchase = Function.dual<
    (
        device: AndroidDevice
    ) => (
        bundleIdentifier: string,
        options: { offerType: number; versionCode: number | bigint; certificateHash?: string }
    ) => Effect.Effect<BuyResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>,
    (
        bundleIdentifier: string,
        options: { offerType: number; versionCode: number | bigint; certificateHash?: string },
        device: AndroidDevice
    ) => Effect.Effect<BuyResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>
>(
    3,
    Effect.fnUntraced(function* (
        bundleIdentifier: string,
        options: { offerType: number; versionCode: number | bigint; certificateHash?: string },
        device: AndroidDevice
    ) {
        const decoderBuyResponse = decodeResponseFromResponseWrapper("buyResponse");
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
    })
);

/**
 * @since 1.0.0
 * @category API
 */
export const delivery = Function.dual<
    (device: AndroidDevice) => (
        bundleIdentifier: string,
        options: {
            offerType: number;
            deliveryToken: string;
            versionCode: number | bigint;
            certificateHash?: string | undefined;
        }
    ) => Effect.Effect<DeliveryResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>,
    (
        bundleIdentifier: string,
        options: {
            offerType: number;
            deliveryToken: string;
            versionCode: number | bigint;
            certificateHash?: string | undefined;
        },
        device: AndroidDevice
    ) => Effect.Effect<DeliveryResponse, HttpClientError.HttpClientError | Schema.SchemaError, HttpClient.HttpClient>
>(
    3,
    Effect.fnUntraced(function* (
        bundleIdentifier: string,
        options: {
            offerType: number;
            deliveryToken: string;
            versionCode: number | bigint;
            certificateHash?: string | undefined;
        },
        device: AndroidDevice
    ) {
        const decoderDeliveryResponse = decodeResponseFromResponseWrapper("deliveryResponse");
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
    })
);

/**
 * @since 1.0.0
 * @category API
 */
export const download = Effect.fnUntraced(function* (
    device: AndroidDevice,
    bundleIdentifier: string
): Effect.fn.Return<
    Array.NonEmptyReadonlyArray<{
        url: string;
        name: string;
        file: string;
        size: bigint;
        integrity: { sha1: string } | { sha256: string };
    }>,
    PlatformError.PlatformError | HttpClientError.HttpClientError | Schema.SchemaError,
    HttpClient.HttpClient | FileSystem.FileSystem | Scope.Scope
> {
    const fileSystem = yield* FileSystem.FileSystem;

    const { item } = yield* details(device)(bundleIdentifier);
    const { encodedDeliveryToken } = yield* purchase(device)(bundleIdentifier, {
        offerType: item?.offer[0].offerType ?? 1,
        versionCode: item?.details?.appDetails?.versionCode ?? 0,
    });

    const deliveryResult = yield* delivery(device)(bundleIdentifier, {
        deliveryToken: encodedDeliveryToken,
        offerType: item?.offer[0].offerType ?? 1,
        versionCode: item?.details?.appDetails?.versionCode ?? 0,
    });

    const mainDeliveryData = deliveryResult?.appDeliveryData;
    if (mainDeliveryData === undefined) {
        return yield* Effect.die("No delivery data available");
    }

    const digest =
        (algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512") =>
        <E, R>(stream: Stream.Stream<Uint8Array, E, R>): Effect.Effect<string, E, R> =>
            stream.pipe(
                Stream.mkUint8Array,
                Effect.flatMap((buffer) =>
                    Effect.promise(() => crypto.subtle.digest(algorithm, buffer as BufferSource))
                ),
                Effect.map((digestBuffer) =>
                    Array.fromIterable(new Uint8Array(digestBuffer))
                        .map((b) => b.toString(16).padStart(2, "0"))
                        .join("")
                )
            );

    const main = Effect.gen(function* () {
        const file = yield* fileSystem.makeTempFileScoped({ suffix: ".apk" });
        const integrity = Buffer.from(mainDeliveryData.sha256, "base64url").toString("hex");
        const downloadedIntegrity = yield* HttpClient.get(mainDeliveryData.downloadUrl).pipe(
            HttpClientResponse.stream,
            Stream.tapSink(fileSystem.sink(file)),
            digest("SHA-256")
        );

        yield* Effect.logDebug(
            `main APK of ${mainDeliveryData.downloadSize}bytes from ${mainDeliveryData.downloadUrl} with integrity ${integrity}(sha256) downloaded to ${file}`
        );

        if (downloadedIntegrity !== integrity) {
            return yield* Effect.die(
                `Downloaded main APK integrity mismatch: expected ${integrity}, got ${downloadedIntegrity}`
            );
        }

        return {
            file,
            name: `${bundleIdentifier}.apk`,
            url: mainDeliveryData.downloadUrl,
            size: mainDeliveryData.downloadSize,
            integrity: { sha256: integrity },
        };
    });

    const splits = Array.map(mainDeliveryData.splitDeliveryData, (split) =>
        Effect.gen(function* () {
            const file = yield* fileSystem.makeTempFileScoped({ suffix: ".apk" });
            const integrity = Buffer.from(split.sha256, "base64url").toString("hex");
            const downloadedIntegrity = yield* HttpClient.get(split.downloadUrl).pipe(
                HttpClientResponse.stream,
                Stream.tapSink(fileSystem.sink(file)),
                digest("SHA-256")
            );

            yield* Effect.logDebug(
                `split ${split.name} of ${split.downloadSize}bytes from ${split.downloadUrl} with integrity ${integrity}(sha256) downloaded to ${file}`
            );

            if (downloadedIntegrity !== integrity) {
                return yield* Effect.die(
                    `Downloaded split ${split.name} integrity mismatch: expected ${integrity}, got ${downloadedIntegrity}`
                );
            }

            return {
                file,
                url: split.downloadUrl,
                size: split.downloadSize,
                name: `${split.name}.apk`,
                integrity: { sha256: integrity },
            };
        })
    );

    const expansions = Array.map(mainDeliveryData.additionalFile, (expansion) =>
        Effect.gen(function* () {
            const typeStr = expansion.fileType === 1 ? "main" : "patch";
            const name = `${typeStr}.${expansion.versionCode}.${bundleIdentifier}.obb`;
            const file = yield* fileSystem.makeTempFileScoped({ suffix: ".obb" });
            const integrity = Buffer.from(expansion.sha1, "base64url").toString("hex");
            const downloadedIntegrity = yield* HttpClient.get(expansion.downloadUrl).pipe(
                HttpClientResponse.stream,
                Stream.tapSink(fileSystem.sink(file)),
                digest("SHA-1")
            );

            yield* Effect.logDebug(
                `expansion file ${name} of ${expansion.size}bytes from ${expansion.downloadUrl} with integrity ${integrity}(sha1) downloaded to ${file}`
            );

            if (downloadedIntegrity !== integrity) {
                return yield* Effect.die(
                    `Downloaded expansion file ${name} integrity mismatch: expected ${integrity}, got ${downloadedIntegrity}`
                );
            }

            return {
                file,
                name,
                size: expansion.size,
                url: expansion.downloadUrl,
                integrity: { sha1: integrity },
            };
        })
    );

    return yield* Effect.all([main, ...splits, ...expansions]);
});
