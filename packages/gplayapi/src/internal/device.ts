import type * as PlatformError from "effect/PlatformError";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";

import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import * as SchemaTransformation from "effect/SchemaTransformation";

import * as internalAuth from "./auth.ts";

export const StringArrayFromString = Schema.suspend(() => {
    const splitter = SchemaGetter.split({ separator: "," });
    const joiner = SchemaGetter.transform((arr: ReadonlyArray<string>) => arr.join(","));
    const transform = SchemaTransformation.make({ encode: joiner, decode: splitter });
    return Schema.String.pipe(Schema.decodeTo(Schema.Array(Schema.String), transform));
});

export const BooleanFromString = Schema.Literals(["true", "false"]).pipe(
    Schema.decodeTo(
        Schema.Boolean,
        SchemaTransformation.transform({
            decode: (str) => str === "true",
            encode: (bool) => (bool ? "true" : "false"),
        })
    )
);

export class AndroidDevice extends Schema.Class<AndroidDevice>("AndroidDevice")({
    UserReadableName: Schema.String,
    "Build.BOOTLOADER": Schema.String,
    "Build.BRAND": Schema.String,
    "Build.DEVICE": Schema.String,
    "Build.FINGERPRINT": Schema.String,
    "Build.HARDWARE": Schema.String,
    "Build.ID": Schema.String,
    "Build.MANUFACTURER": Schema.String,
    "Build.MODEL": Schema.String,
    "Build.PRODUCT": Schema.String,
    "Build.RADIO": Schema.String,
    "Build.VERSION.RELEASE": Schema.String,
    "Build.VERSION.SDK_INT": Schema.NumberFromString,
    CellOperator: Schema.String,
    Client: Schema.String,
    Features: StringArrayFromString,
    "GL.Extensions": StringArrayFromString,
    "GL.Version": Schema.NumberFromString,
    "GSF.version": Schema.NumberFromString,
    HasFiveWayNavigation: BooleanFromString,
    HasHardKeyboard: BooleanFromString,
    Keyboard: Schema.NumberFromString,
    Locales: StringArrayFromString,
    Navigation: Schema.NumberFromString,
    Platforms: StringArrayFromString,
    Roaming: Schema.String,
    "Screen.Density": Schema.NumberFromString,
    "Screen.Height": Schema.NumberFromString,
    "Screen.Width": Schema.NumberFromString,
    ScreenLayout: Schema.NumberFromString,
    SharedLibraries: StringArrayFromString,
    SimCountry: Schema.String.pipe(Schema.optional),
    SimOperator: Schema.String.pipe(Schema.optional),
    TimeZone: Schema.String,
    TouchScreen: Schema.NumberFromString,
    "Vending.version": Schema.NumberFromString,
    "Vending.versionString": Schema.String,
}) {
    private authHeadersCache?: Record<string, string> | undefined = undefined;

    public static fromPropertiesFile = Effect.fnUntraced(function* (
        file: string
    ): Effect.fn.Return<AndroidDevice, Schema.SchemaError | PlatformError.PlatformError, FileSystem.FileSystem> {
        const decodeDevice = Schema.decodeUnknownEffect(AndroidDevice);
        const decodePropertiesFile = Schema.decodeEffect(
            Schema.String.pipe(
                Schema.decodeTo(
                    Schema.Record(Schema.String, Schema.String),
                    SchemaTransformation.splitKeyValue({
                        keyValueSeparator: "=",
                        separator: "\n",
                    })
                )
            )
        );

        const fileSystem = yield* FileSystem.FileSystem;
        const content = yield* fileSystem.readFileString(file);
        const properties = yield* decodePropertiesFile(content);
        return yield* decodeDevice(properties);
    });

    public static EmbeddedPixel7a = Path.Path.pipe(
        Effect.flatMap((path) => path.fromFileUrl(new URL("../../devices/arm64_xxhdpi.properties", import.meta.url))),
        Effect.flatMap(AndroidDevice.fromPropertiesFile)
    );

    public get userAgent(): string {
        const deviceProperties = {
            api: 3,
            versionCode: this["Vending.version"],
            sdk: this["Build.VERSION.SDK_INT"],
            device: this["Build.DEVICE"],
            hardware: this["Build.HARDWARE"],
            product: this["Build.PRODUCT"],
            platformVersionRelease: this["Build.VERSION.RELEASE"],
            model: this["Build.MODEL"],
            buildId: this["Build.ID"],
            isWideScreen: 0,
            supportedAbis: this["Platforms"].join(";"),
        };

        const devicePropertiesString = Object.entries(deviceProperties)
            .map(([k, v]) => `${k}=${v}`)
            .join(",");

        return `Android-Finsky/${this["Vending.versionString"]} (${devicePropertiesString})`;
    }

    public readonly authHeaders: Effect.Effect<
        Record<string, string>,
        HttpClientError.HttpClientError | Schema.SchemaError,
        HttpClient.HttpClient
    > = Effect.gen({ self: this }, function* () {
        if (this.authHeadersCache) {
            return this.authHeadersCache;
        } else {
            const authHeaders = yield* internalAuth.authHeaders(this);
            this.authHeadersCache = authHeaders;
            return this.authHeadersCache;
        }
    });
}
