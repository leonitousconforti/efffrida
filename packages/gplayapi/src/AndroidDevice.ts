/**
 * Google play android device profiles.
 *
 * @since 1.0.0
 */

import type * as PlatformError from "effect/PlatformError";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";

import * as Clock from "effect/Clock";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import * as SchemaTransformation from "effect/SchemaTransformation";

import type { PlayAccount, PlayAccountError } from "./PlayAccount.ts";

import * as internalAuth from "./internal/auth.ts";

/** @internal */
const StringArrayFromString = Schema.suspend(() => {
    const splitter = SchemaGetter.split({ separator: "," });
    const joiner = SchemaGetter.transform((arr: ReadonlyArray<string>) => arr.join(","));
    const transform = SchemaTransformation.make({ encode: joiner, decode: splitter });
    return Schema.String.pipe(Schema.decodeTo(Schema.Array(Schema.String), transform));
});

/** @internal */
const BooleanFromString = Schema.Literals(["true", "false"])
    .transform([true, false])
    .pipe(Schema.decodeTo(Schema.Boolean));

/**
 * @since 1.0.0
 * @category Tags
 */
export class AndroidDeviceService extends Context.Service<AndroidDeviceService, AndroidDevice>()(
    "@efffrida/gplayapi/AndroidDevice"
) {}

/**
 * How long resolved auth headers stay usable. Google's oauth tokens live for an
 * hour, so re-acquiring well inside that window keeps a long lived process from
 * ever reaching for headers that expired underneath it.
 *
 * @since 1.0.0
 * @category Constants
 */
export const authHeadersTtl: Duration.Duration = Duration.minutes(30);

/**
 * The profile of the android device that google play requests are made as.
 *
 * @since 1.0.0
 * @category Models
 */
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
    "Build.VERSION.SDK_INT": Schema.FiniteFromString,
    CellOperator: Schema.String,
    Client: Schema.String,
    Features: StringArrayFromString,
    "GL.Extensions": StringArrayFromString,
    "GL.Version": Schema.FiniteFromString,
    "GSF.version": Schema.FiniteFromString,
    HasFiveWayNavigation: BooleanFromString,
    HasHardKeyboard: BooleanFromString,
    Keyboard: Schema.FiniteFromString,
    Locales: StringArrayFromString,
    Navigation: Schema.FiniteFromString,
    Platforms: StringArrayFromString,
    Roaming: Schema.String,
    "Screen.Density": Schema.FiniteFromString,
    "Screen.Height": Schema.FiniteFromString,
    "Screen.Width": Schema.FiniteFromString,
    ScreenLayout: Schema.FiniteFromString,
    SharedLibraries: StringArrayFromString,
    SimCountry: Schema.String.pipe(Schema.optional),
    SimOperator: Schema.String.pipe(Schema.optional),
    TimeZone: Schema.String,
    TouchScreen: Schema.FiniteFromString,
    "Vending.version": Schema.FiniteFromString,
    "Vending.versionString": Schema.String,
}) {
    private authHeadersCache?: { readonly headers: Record<string, string>; readonly expiresAt: number } | undefined =
        undefined;

    /**
     * @since 1.0.0
     * @category Destructors
     */
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

    /**
     * @since 1.0.0
     * @category Destructors
     */
    public readonly authHeaders: Effect.Effect<
        Record<string, string>,
        HttpClientError.HttpClientError | Schema.SchemaError | PlayAccountError,
        HttpClient.HttpClient | PlayAccount
    > = Effect.gen({ self: this }, function* () {
        const now = yield* Clock.currentTimeMillis;
        const cached = this.authHeadersCache;

        if (cached !== undefined && cached.expiresAt > now) {
            return cached.headers;
        }

        const headers = yield* internalAuth.authHeaders(this);
        this.authHeadersCache = { headers, expiresAt: now + Duration.toMillis(authHeadersTtl) };
        return headers;
    });

    /**
     * Drops the cached auth headers so that the next `authHeaders` evaluation
     * re-runs the whole acquisition, whether or not they have expired.
     *
     * @internal
     */
    public invalidateAuthHeaders(): void {
        this.authHeadersCache = undefined;
    }
}

/**
 * @since 1.0.0
 * @category Constructors
 */
export const fromPropertiesFile = Effect.fnUntraced(function* (
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

/**
 * @since 1.0.0
 * @category Constructors
 */
export const EmbeddedPixel7a: Effect.Effect<
    AndroidDevice,
    Schema.SchemaError | PlatformError.BadArgument | PlatformError.PlatformError,
    Path.Path | FileSystem.FileSystem
> = Path.Path.pipe(
    Effect.flatMap((path) => path.fromFileUrl(new URL("../devices/arm64_xxhdpi.properties", import.meta.url))),
    Effect.flatMap(fromPropertiesFile)
);

/**
 * @since 1.0.0
 * @category Layers
 */
export const EmbeddedPixel7aLive: Layer.Layer<
    AndroidDeviceService,
    Schema.SchemaError | PlatformError.BadArgument | PlatformError.PlatformError,
    Path.Path | FileSystem.FileSystem
> = Layer.effect(AndroidDeviceService, EmbeddedPixel7a);
