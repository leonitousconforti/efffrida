import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

import * as Protobuf from "@bufbuild/protobuf";

import {
    AndroidCheckinResponseSchema,
    type PayloadSchema,
    ResponseWrapperSchema,
} from "../src/generated/GooglePlay_pb.ts";

/** The android id that the canned checkin response hands out. */
export const androidId = 0x1234n;

/** The consistency token that the canned checkin response hands out. */
export const deviceCheckinConsistencyToken = "consistency-token";

/** The config token that the canned uploadDeviceConfig response hands out. */
export const uploadDeviceConfigToken = "config-token";

/** The stream url that the canned details response hands out. */
export const detailsStreamUrl = "https://play.google.com/store/apps/details";

/** A protobuf body wrapped in the envelope that the fdfe endpoints use. */
export const responseWrapper = (payload: Protobuf.MessageInitShape<typeof PayloadSchema>): Response => {
    const bytes = Protobuf.toBinary(ResponseWrapperSchema, Protobuf.create(ResponseWrapperSchema, { payload }));
    return new Response(bytes, { status: 200 });
};

/** A canned response for `https://android.clients.google.com/checkin`. */
export const checkinResponse = (): Response => {
    const bytes = Protobuf.toBinary(
        AndroidCheckinResponseSchema,
        Protobuf.create(AndroidCheckinResponseSchema, { androidId, deviceCheckinConsistencyToken })
    );
    return new Response(bytes, { status: 200 });
};

/** A canned response for `https://android.clients.google.com/fdfe/uploadDeviceConfig`. */
export const uploadDeviceConfigResponse = (): Response =>
    responseWrapper({ uploadDeviceConfigResponse: { uploadDeviceConfigToken } });

/** A canned response for `https://android.clients.google.com/fdfe/details`. */
export const detailsResponse = (): Response => responseWrapper({ detailsResponse: { detailsStreamUrl } });

/** A canned response for an aurora store compatible dispenser. */
export const dispenserResponse = (body: unknown): Response =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });

/**
 * A request that a {@link mockHttpClient} was asked to execute. The url is the
 * resolved one, so it already carries the query string.
 */
export interface RecordedRequest {
    readonly url: string;
    readonly method: string;
    readonly headers: Record<string, string>;
}

/**
 * An http client that answers from `handler` instead of the network, and
 * records everything it was asked to send.
 */
export const mockHttpClient = (
    handler: (request: RecordedRequest) => Response
): {
    readonly layer: Layer.Layer<HttpClient.HttpClient, never, never>;
    readonly requests: Array<RecordedRequest>;
} => {
    const requests: Array<RecordedRequest> = [];

    const client = HttpClient.make((request, url) => {
        const recorded: RecordedRequest = {
            url: url.toString(),
            method: request.method,
            headers: { ...request.headers },
        };

        requests.push(recorded);
        return Effect.succeed(HttpClientResponse.fromWeb(request, handler(recorded)));
    });

    return { layer: Layer.succeed(HttpClient.HttpClient, client), requests };
};

/** How many recorded requests went to a url containing `fragment`. */
export const countRequests = (requests: ReadonlyArray<RecordedRequest>, fragment: string): number =>
    requests.filter((request) => request.url.includes(fragment)).length;
