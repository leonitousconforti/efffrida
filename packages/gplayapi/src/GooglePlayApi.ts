/**
 * Unofficial Google Play Store API for downloading APKs directly from Google
 * Play Store.
 *
 * @since 1.0.0
 */

import type * as PlatformError from "@effect/platform/Error";
import type * as HttpClientError from "@effect/platform/HttpClientError";
import type * as Scope from "effect/Scope";

import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as FileSystem from "@effect/platform/FileSystem";
import * as HttpClient from "@effect/platform/HttpClient";
import * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import * as HttpClientResponse from "@effect/platform/HttpClientResponse";
import * as Array from "effect/Array";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as url from "node:url";

import {
    BulkDetailsRequestSchema,
    type BulkDetailsResponse,
    type BuyResponse,
    type DetailsResponse,
} from "./generated/GooglePlay_pb.ts";
import { makeHttpClient } from "./internal/auth.ts";
import { Device } from "./internal/device.ts";
import { decodeResponseFromResponseWrapper, encodeRequest } from "./internal/http.ts";

export {
    /**
     * @since 1.0.0
     * @category Auth
     */
    makeHttpClient,
} from "./internal/auth.ts";

export {
    /**
     * @since 1.0.0
     * @category Device
     */
    Device,
} from "./internal/device.ts";

/**
 * @since 1.0.0
 * @category Auth
 */
export const defaultHttpClient = Function.pipe(
    Device.fromPropertiesFile(url.fileURLToPath(new URL("../devices/arm64_xxhdpi.properties", import.meta.url))),
    Effect.map(makeHttpClient),
    Layer.unwrapEffect,
    Layer.provide(FetchHttpClient.layer)
);

/**
 * @since 1.0.0
 * @category API
 */
export const details = (
    bundleIdentifier: string
): Effect.Effect<DetailsResponse, HttpClientError.HttpClientError, HttpClient.HttpClient> =>
    Effect.flatMap(
        HttpClient.get("/fdfe/details", { urlParams: { doc: bundleIdentifier } }),
        decodeResponseFromResponseWrapper("detailsResponse")
    );

/**
 * @since 1.0.0
 * @category API
 */
export const bulkDetails = (
    bundleIdentifier: string
): Effect.Effect<BulkDetailsResponse, HttpClientError.HttpClientError, HttpClient.HttpClient> =>
    Function.pipe(
        HttpClientRequest.post("/fdfe/bulkDetails"),
        encodeRequest(BulkDetailsRequestSchema, {
            includeDetails: true,
            includeChildDocs: true,
            DocId: [bundleIdentifier],
        }),
        Effect.flatMap(HttpClient.execute),
        Effect.flatMap(decodeResponseFromResponseWrapper("bulkDetailsResponse"))
    );

/**
 * @since 1.0.0
 * @category API
 */
export const purchase = (
    bundleIdentifier: string,
    options: {
        offerType: number;
        versionCode: number | bigint;
        certificateHash?: string | undefined;
    }
): Effect.Effect<BuyResponse, HttpClientError.HttpClientError, HttpClient.HttpClient> =>
    Effect.flatMap(
        HttpClient.post("/fdfe/purchase", {
            urlParams: {
                doc: bundleIdentifier,
                ch: options.certificateHash ?? "",
                ot: options.offerType.toString(),
                vc: options.versionCode.toString(),
            },
        }),
        decodeResponseFromResponseWrapper("buyResponse")
    );

/**
 * @since 1.0.0
 * @category API
 */
export const delivery = (
    bundleIdentifier: string,
    options: {
        offerType: number;
        deliveryToken: string;
        versionCode: number | bigint;
        certificateHash?: string | undefined;
    }
) =>
    Effect.flatMap(
        HttpClient.get("/fdfe/delivery", {
            urlParams: {
                doc: bundleIdentifier,
                dtok: options.deliveryToken,
                ch: options.certificateHash ?? "",
                ot: options.offerType.toString(),
                vc: options.versionCode.toString(),
            },
        }),
        decodeResponseFromResponseWrapper("deliveryResponse")
    );

/**
 * @since 1.0.0
 * @category API
 */
export const download = Effect.fnUntraced(function* (bundleIdentifier: string): Effect.fn.Return<
    Array.NonEmptyReadonlyArray<{
        url: string;
        name: string;
        file: string;
        size: number | bigint;
        integrity: { sha1: string } | { sha256: string };
    }>,
    PlatformError.PlatformError | HttpClientError.HttpClientError,
    HttpClient.HttpClient | FileSystem.FileSystem | Scope.Scope
> {
    const fileSystem = yield* FileSystem.FileSystem;

    const { item } = yield* details(bundleIdentifier);
    const { encodedDeliveryToken } = yield* purchase(bundleIdentifier, {
        offerType: item?.offer[0].offerType ?? 1,
        versionCode: item?.details?.appDetails?.versionCode ?? 0,
    });

    const deliveryResult = yield* delivery(bundleIdentifier, {
        deliveryToken: encodedDeliveryToken,
        offerType: item?.offer[0].offerType ?? 1,
        versionCode: item?.details?.appDetails?.versionCode ?? 0,
    });

    const mainDeliveryData = deliveryResult?.appDeliveryData;
    if (mainDeliveryData === undefined) {
        return yield* Effect.dieMessage("No delivery data available");
    }

    const digestSink = (
        algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"
    ): Sink.Sink<string, Uint8Array, never, never, never> => {
        const toHex = (buffer: ArrayBuffer): string =>
            Array.fromIterable(new Uint8Array(buffer))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

        const digestToHex = (data: BufferSource): Effect.Effect<string, never, never> =>
            Effect.map(
                Effect.promise(() => crypto.subtle.digest(algorithm, data)),
                toHex
            );

        return Sink.mapEffect(
            Sink.foldLeft(Buffer.alloc(0), (acc, chunk: Uint8Array) => Buffer.concat([acc, chunk])),
            digestToHex
        );
    };

    const main = Effect.gen(function* () {
        const file = yield* fileSystem.makeTempFileScoped({ suffix: ".apk" });
        const integrity = Buffer.from(mainDeliveryData.sha256, "base64url").toString("hex");
        const stream = HttpClientResponse.stream(HttpClient.get(mainDeliveryData.downloadUrl));
        const downloadedIntegrity = yield* Stream.run(
            stream,
            Sink.zipRight(fileSystem.sink(file), digestSink("SHA-256"), { concurrent: true })
        );

        yield* Effect.logDebug(
            `main APK of ${mainDeliveryData.downloadSize}bytes from ${mainDeliveryData.downloadUrl} with integrity ${integrity}(sha256) downloaded to ${file}`
        );

        if (downloadedIntegrity !== integrity) {
            return yield* Effect.dieMessage(
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
            const stream = HttpClientResponse.stream(HttpClient.get(split.downloadUrl));
            const downloadedIntegrity = yield* Stream.run(
                stream,
                Sink.zipRight(fileSystem.sink(file), digestSink("SHA-256"), { concurrent: true })
            );

            yield* Effect.logDebug(
                `split ${split.name} of ${split.downloadSize}bytes from ${split.downloadUrl} with integrity ${integrity}(sha256) downloaded to ${file}`
            );

            if (downloadedIntegrity !== integrity) {
                return yield* Effect.dieMessage(
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
            const stream = HttpClientResponse.stream(HttpClient.get(expansion.downloadUrl));
            const downloadedIntegrity = yield* Stream.run(
                stream,
                Sink.zipRight(fileSystem.sink(file), digestSink("SHA-1"), { concurrent: true })
            );

            yield* Effect.logDebug(
                `expansion file ${name} of ${expansion.size}bytes from ${expansion.downloadUrl} with integrity ${integrity}(sha1) downloaded to ${file}`
            );

            if (downloadedIntegrity !== integrity) {
                return yield* Effect.dieMessage(
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
