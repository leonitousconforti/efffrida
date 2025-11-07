import type * as PlatformError from "@effect/platform/Error";
import type * as ParseResult from "effect/ParseResult";

import * as FileSystem from "@effect/platform/FileSystem";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as PropertiesFile from "properties-file";

/** @internal */
export class Device extends Schema.Class<Device>("Device")({
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
    Features: Schema.transform(Schema.String, Schema.Array(Schema.String), {
        encode: (features) => features.join(","),
        decode: (str) => str.split(","),
    }),
    "GL.Extensions": Schema.transform(Schema.String, Schema.Array(Schema.String), {
        encode: (extensions) => extensions.join(","),
        decode: (str) => str.split(","),
    }),
    "GL.Version": Schema.NumberFromString,
    "GSF.version": Schema.NumberFromString,
    HasFiveWayNavigation: Schema.BooleanFromString,
    HasHardKeyboard: Schema.BooleanFromString,
    Keyboard: Schema.NumberFromString,
    Locales: Schema.transform(Schema.String, Schema.Array(Schema.String), {
        encode: (locales) => locales.join(","),
        decode: (str) => str.split(","),
    }),
    Navigation: Schema.NumberFromString,
    Platforms: Schema.transform(Schema.String, Schema.Array(Schema.String), {
        encode: (libs) => libs.join(","),
        decode: (str) => str.split(","),
    }),
    Roaming: Schema.String,
    "Screen.Density": Schema.NumberFromString,
    "Screen.Height": Schema.NumberFromString,
    "Screen.Width": Schema.NumberFromString,
    ScreenLayout: Schema.NumberFromString,
    SharedLibraries: Schema.transform(Schema.String, Schema.Array(Schema.String), {
        encode: (libs) => libs.join(","),
        decode: (str) => str.split(","),
    }),
    SimCountry: Schema.String.pipe(Schema.optional),
    SimOperator: Schema.String.pipe(Schema.optional),
    TimeZone: Schema.String,
    TouchScreen: Schema.NumberFromString,
    "Vending.version": Schema.NumberFromString,
    "Vending.versionString": Schema.String,
}) {
    public static fromPropertiesFile = (
        path: string
    ): Effect.Effect<Device, PlatformError.PlatformError | ParseResult.ParseError, FileSystem.FileSystem> =>
        Effect.gen(function* () {
            const fileSystem = yield* FileSystem.FileSystem;
            const content = yield* fileSystem.readFileString(path);
            const properties = PropertiesFile.getProperties(content);
            const device = yield* Schema.decodeUnknown(Device)(properties);
            return device;
        });

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
}
