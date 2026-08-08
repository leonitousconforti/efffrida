# @efffrida/gplayapi

Unofficial Google Play Store API for downloading APKs directly from the Google Play Store.

### Play account credentials

Every `GooglePlayApi` call authenticates with a Play account, and how that account is obtained is a
policy decision left to the application. Provide exactly one `PlayAccount` layer; leaving it out is a
compile error rather than a runtime surprise.

| Layer                              | Where the credentials come from                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PlayAccount.layerAuroraDispenser` | An Aurora store compatible anonymous dispenser, `https://auroraoss.com/api/auth` by default. Requires an `HttpClient`. |
| `PlayAccount.layerConfig`          | The config provider, reading `GPLAY_EMAIL` and `GPLAY_AUTH_TOKEN` by default.                                          |
| `PlayAccount.layerStatic`          | Credentials that are already in hand, for tests and for applications that fetch their token out of band.               |

The hosted Aurora dispenser blocks and rate limits datacenter ip ranges, so anything running on cloud
infrastructure should use `layerConfig` (or `layerStatic`) with a token acquired elsewhere.

### Example usage

```typescript
import { NodeHttpClient, NodeServices } from "@effect/platform-node";
import { GooglePlayApi, PlayAccount } from "@efffrida/gplayapi";
import { Effect, Layer } from "effect";

const DeviceLive = GooglePlayApi.AndroidDevice.EmbeddedPixel7aLive;
const HttpLive = NodeHttpClient.layerUndici;

// Reads GPLAY_EMAIL and GPLAY_AUTH_TOKEN
const AccountLive = PlayAccount.layerConfig();

const PlayLive = Layer.mergeAll(DeviceLive, HttpLive, AccountLive).pipe(Layer.provide(NodeServices.layer));

const program = Effect.gen(function* () {
    const details = yield* GooglePlayApi.details("com.nimblebit.tinytower");
    // ...
}).pipe(Effect.provide(PlayLive));
```

To keep the pre-`PlayAccount` behaviour, add the dispenser layer to an existing composition:

```diff
-const PlayLive = Layer.mergeAll(DeviceLive, HttpLive);
+const AccountLive = PlayAccount.layerAuroraDispenser().pipe(Layer.provide(HttpLive));
+const PlayLive = Layer.mergeAll(DeviceLive, HttpLive, AccountLive);
```

Auth headers are cached per device. When Play answers a request with a 401 or a 403 the cache is
dropped, the credentials are reacquired, and the request is retried exactly once.
