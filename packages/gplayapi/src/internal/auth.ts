import type * as HttpClientError from "@effect/platform/HttpClientError";
import type * as ParseResult from "effect/ParseResult";

import * as HttpClient from "@effect/platform/HttpClient";
import * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import * as HttpClientResponse from "@effect/platform/HttpClientResponse";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";

import {
    AndroidCheckinRequestSchema,
    AndroidCheckinResponseSchema,
    UploadDeviceConfigRequestSchema,
} from "../generated/GooglePlay_pb.js";
import { type Device } from "./device.js";
import { decodeResponse, decodeResponseFromResponseWrapper, encodeRequest } from "./http.js";

/** @internal */
export const makeHttpClient: (
    device: Device
) => Layer.Layer<
    HttpClient.HttpClient,
    HttpClientError.HttpClientError | ParseResult.ParseError,
    HttpClient.HttpClient
> = Effect.fnUntraced(function* (device: Device) {
    //  curl \
    //      --request GET \
    //      --header "Accept: application/json" \
    //      --header "User-Agent: com.aurora.store-4.7.5-71" \
    //      "https://auroraoss.com/api/auth"
    const account = yield* Function.pipe(
        HttpClientRequest.get("https://auroraoss.com/api/auth"),
        HttpClientRequest.setHeader("User-Agent", "com.aurora.store-4.7.5-71"),
        HttpClientRequest.acceptJson,
        HttpClient.execute,
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(
            HttpClientResponse.schemaBodyJson(
                Schema.Struct({
                    email: Schema.String,
                    auth: Schema.String,
                })
            )
        )
    );

    const checkinResponse = yield* Function.pipe(
        HttpClientRequest.post("https://android.clients.google.com/checkin"),
        HttpClientRequest.setHeaders({
            "User-Agent": device.userAgent,
            app: "com.google.android.gms",
            Host: "android.clients.google.com",
        }),
        encodeRequest(AndroidCheckinRequestSchema, {
            id: 0n,
            version: 3,
            fragment: 0,
            locale: "en",
            timeZone: device.TimeZone,
            checkin: {
                userNumber: 0,
                lastCheckinMsec: 0n,
                roaming: device.Roaming,
                cellOperator: device.CellOperator,
                simOperator: device.SimOperator ?? "",
                build: {
                    id: device["Build.FINGERPRINT"],
                    product: device["Build.HARDWARE"],
                    carrier: device["Build.BRAND"],
                    radio: device["Build.RADIO"],
                    bootloader: device["Build.BOOTLOADER"],
                    device: device["Build.DEVICE"],
                    sdkVersion: device["Build.VERSION.SDK_INT"],
                    model: device["Build.MODEL"],
                    manufacturer: device["Build.MANUFACTURER"],
                    buildProduct: device["Build.PRODUCT"],
                    client: device["Client"],
                    timestamp: BigInt(Date.now()),
                    googleServices: device["GSF.version"],
                },
            },
            deviceConfiguration: {
                touchScreen: device["TouchScreen"],
                keyboard: device["Keyboard"],
                navigation: device["Navigation"],
                screenLayout: device["ScreenLayout"],
                hasHardKeyboard: device["HasHardKeyboard"],
                hasFiveWayNavigation: device["HasFiveWayNavigation"],
                glEsVersion: device["GL.Version"],
                glExtension: device["GL.Extensions"] as Array<string>,
                systemSharedLibrary: device["SharedLibraries"] as Array<string>,
                systemAvailableFeature: device["Features"] as Array<string>,
                nativePlatform: device["Platforms"] as Array<string>,
                screenDensity: device["Screen.Density"],
                screenWidth: device["Screen.Width"],
                screenHeight: device["Screen.Height"],
                systemSupportedLocale: device["Locales"] as Array<string>,
                deviceClass: 0,
                deviceFeature: device["Features"].map((val) => ({ name: val, value: 0 })),
            },
        }),
        Effect.flatMap(HttpClient.execute),
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(decodeResponse(AndroidCheckinResponseSchema))
    );

    const uploadDeviceConfigResponse = yield* Function.pipe(
        HttpClientRequest.post("https://android.clients.google.com/fdfe/uploadDeviceConfig"),
        HttpClientRequest.setHeaders({
            "X-DFE-Encoded-Targets": "",
            "User-Agent": device.userAgent,
            "X-DFE-Cookie": "",
            "X-DFE-Content-Filters": "",
            "X-DFE-Device-Checkin-Consistency-Token": checkinResponse.deviceCheckinConsistencyToken,
            "X-DFE-Device-Config-Token": "",
            "X-DFE-MCCMNC": "21601",
            "X-DFE-Client-Id": "am-android-google",
            "X-DFE-UserLanguages": "en",
            "X-DFE-Phenotype": "",
            "X-DFE-Device-Id": checkinResponse.androidId.toString(16),
            "X-DFE-Network-Type": "4",
            "Accept-Language": "en",
            "X-DFE-Request-Params": "timeoutMs=4000",
            "X-DFE-Enabled-Experiments": "cl:billing.select_add_instrument_by_default",
            "X-DFE-Unsupported-Experiments":
                "nocache:billing.use_charging_poller,market_emails,buyer_currency,prod_baseline,checkin.set_asset_paid_app_field,shekel_test,content_ratings,buyer_currency_in_app,nocache:encrypted_apk,recent_changes",
            Host: "android.clients.google.com",
        }),
        encodeRequest(UploadDeviceConfigRequestSchema, {
            deviceConfiguration: {
                touchScreen: Number(device["TouchScreen"]),
                keyboard: Number(device["Keyboard"]),
                navigation: Number(device["Navigation"]),
                screenLayout: Number(device["ScreenLayout"]),
                hasHardKeyboard: Boolean(device["HasHardKeyboard"]),
                hasFiveWayNavigation: Boolean(device["HasFiveWayNavigation"]),
                glEsVersion: Number(device["GL.Version"]),
                glExtension: device["GL.Extensions"] as Array<string>,
                systemSharedLibrary: device["SharedLibraries"] as Array<string>,
                systemAvailableFeature: device["Features"] as Array<string>,
                nativePlatform: device["Platforms"] as Array<string>,
                screenDensity: Number(device["Screen.Density"]),
                screenWidth: Number(device["Screen.Width"]),
                screenHeight: Number(device["Screen.Height"]),
                systemSupportedLocale: device["Locales"] as Array<string>,
                deviceClass: 0,
                deviceFeature: device["Features"].map((val) => ({ name: val, value: 0 })),
            },
        }),
        Effect.flatMap(HttpClient.execute),
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(decodeResponseFromResponseWrapper("uploadDeviceConfigResponse"))
    );

    // const authResponse = yield* Function.pipe(
    //     HttpClientRequest.post("https://android.clients.google.com/auth"),
    //     HttpClientRequest.setHeaders({
    //         app: "com.google.android.gms",
    //         device: checkinResponse.androidId.toString(16),
    //         "User-Agent": `GoogleAuth/1.4 (${device["Build.DEVICE"]} ${device["Build.ID"]})`,
    //     }),
    //     HttpClientRequest.setUrlParams({
    //         app: "com.android.vending",
    //         oauth2_foreground: "1",
    //         Email: account.email,
    //         token_request_options: "CAA4AVAB",
    //         client_sig: "38918a453d07199354f8b19af05ec6562ced5788",
    //         Token: account.auth,
    //         google_play_services_version: `${device["GSF.version"]}`,
    //         check_email: "1",
    //         system_partition: "1",
    //         sdk_version: `${device["Build.VERSION.SDK_INT"]}`,
    //         callerPkg: "com.google.android.gms",
    //         device_country: "IN",
    //         lang: "en",
    //         androidId: checkinResponse.androidId.toString(16),
    //         callerSig: "38918a453d07199354f8b19af05ec6562ced5788",
    //         service: "oauth2:https://www.googleapis.com/auth/googleplay",
    //     }),
    //     HttpClient.execute,
    //     Effect.flatMap(HttpClientResponse.filterStatusOk),
    //     Effect.flatMap((response) => response.text)
    // );

    return Layer.function(
        HttpClient.HttpClient,
        HttpClient.HttpClient,
        Function.flow(
            HttpClient.filterStatusOk,
            HttpClient.mapRequest(
                HttpClientRequest.updateUrl((url) =>
                    url.startsWith("/fdfe/") ? `https://android.clients.google.com${url}` : url
                )
            ),
            HttpClient.mapRequest(
                HttpClientRequest.setHeaders({
                    Authorization: "Bearer " + account.auth,
                    "User-Agent": device.userAgent,
                    "X-DFE-Device-Id": checkinResponse.androidId.toString(16),
                    "Accept-Language": "en",
                    "X-DFE-Encoded-Targets":
                        "CAESN/qigQYC2AMBFfUbyA7SM5Ij/CvfBoIDgxHqGP8R3xzIBvoQtBKFDZ4HAY4FrwSVMasHBO0O2Q8akgYRAQECAQO7AQEpKZ0CnwECAwRrAQYBr9PPAoK7sQMBAQMCBAkIDAgBAwEDBAICBAUZEgMEBAMLAQEBBQEBAcYBARYED+cBfS8CHQEKkAEMMxcBIQoUDwYHIjd3DQ4MFk0JWGYZEREYAQOLAYEBFDMIEYMBAgICAgICOxkCD18LGQKEAcgDBIQBAgGLARkYCy8oBTJlBCUocxQn0QUBDkkGxgNZQq0BZSbeAmIDgAEBOgGtAaMCDAOQAZ4BBIEBKUtQUYYBQscDDxPSARA1oAEHAWmnAsMB2wFyywGLAxol+wImlwOOA80CtwN26A0WjwJVbQEJPAH+BRDeAfkHK/ABASEBCSAaHQemAzkaRiu2Ad8BdXeiAwEBGBUBBN4LEIABK4gB2AFLfwECAdoENq0CkQGMBsIBiQEtiwGgA1zyAUQ4uwS8AwhsvgPyAcEDF27vApsBHaICGhl3GSKxAR8MC6cBAgItmQYG9QIeywLvAeYBDArLAh8HASI4ELICDVmVBgsY/gHWARtcAsMBpALiAdsBA7QBpAJmIArpByn0AyAKBwHTARIHAX8D+AMBcRIBBbEDmwUBMacCHAciNp0BAQF0OgQLJDuSAh54kwFSP0eeAQQ4M5EBQgMEmwFXywFo0gFyWwMcapQBBugBPUW2AVgBKmy3AR6PAbMBGQxrUJECvQR+8gFoWDsYgQNwRSczBRXQAgtRswEW0ALMAREYAUEBIG6yATYCRE8OxgER8gMBvQEDRkwLc8MBTwHZAUOnAXiiBakDIbYBNNcCIUmuArIBSakBrgFHKs0EgwV/G3AD0wE6LgECtQJ4xQFwFbUCjQPkBS6vAQqEAUZF3QIM9wEhCoYCQhXsBCyZArQDugIziALWAdIBlQHwBdUErQE6qQaSA4EEIvYBHir9AQVLmgMCApsCKAwHuwgrENsBAjNYswEVmgIt7QJnN4wDEnta+wGfAcUBxgEtEFXQAQWdAUAeBcwBAQM7rAEJATJ0LENrdh73A6UBhAE+qwEeASxLZUMhDREuH0CGARbd7K0GlQo",
                    "X-DFE-Phenotype":
                        "H4sIAAAAAAAAAB3OO3KjMAAA0KRNuWXukBkBQkAJ2MhgAZb5u2GCwQZbCH_EJ77QHmgvtDtbv-Z9_H63zXXU0NVPB1odlyGy7751Q3CitlPDvFd8lxhz3tpNmz7P92CFw73zdHU2Ie0Ad2kmR8lxhiErTFLt3RPGfJQHSDy7Clw10bg8kqf2owLokN4SecJTLoSwBnzQSd652_MOf2d1vKBNVedzg4ciPoLz2mQ8efGAgYeLou-l-PXn_7Sna1MfhHuySxt-4esulEDp8Sbq54CPPKjpANW-lkU2IZ0F92LBI-ukCKSptqeq1eXU96LD9nZfhKHdtjSWwJqUm_2r6pMHOxk01saVanmNopjX3YxQafC4iC6T55aRbC8nTI98AF_kItIQAJb5EQxnKTO7TZDWnr01HVPxelb9A2OWX6poidMWl16K54kcu_jhXw-JSBQkVcD_fPsLSZu6joIBAAA",
                    "X-DFE-Client-Id": "am-android-google",
                    "X-DFE-Network-Type": "4",
                    "X-DFE-Content-Filters": "",
                    "X-Limit-Ad-Tracking-Enabled": "false",
                    "X-Ad-Id": "",
                    "X-DFE-UserLanguages": "en",
                    "X-DFE-Request-Params": "timeoutMs=4000",
                    "X-DFE-Device-Checkin-Consistency-Token": checkinResponse.deviceCheckinConsistencyToken,
                    "X-DFE-Device-Config-Token": uploadDeviceConfigResponse.uploadDeviceConfigToken,
                })
            )
        )
    );
}, Layer.unwrapEffect);
