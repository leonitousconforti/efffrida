# @efffrida/gplayapi

Unofficial Google Play Store API for downloading APKs directly from the Google Play Store.

The store's protobuf endpoints are exposed as effects: `details` and `bulkDetails` for app metadata,
`purchase` and `delivery` for acquiring a download token, and `downloadToStreams` and
`downloadToDisk` for pulling down the APK along with its splits and expansion files.

### Example usage

```typescript
import { Effect, Layer } from "effect";

import { NodeCrypto, NodeHttpClient, NodeServices } from "@effect/platform-node";
import { AndroidDevice, GooglePlayApi, PlayAccount } from "@efffrida/gplayapi";

const PlayLive = Layer.mergeAll(
    AndroidDevice.EmbeddedPixel7aLive,
    NodeHttpClient.layerUndici,
    PlayAccount.layerConfig()
).pipe(Layer.provideMerge(Layer.merge(NodeServices.layer, NodeCrypto.layerDigest)));

const program = Effect.gen(function* () {
    const { item } = yield* GooglePlayApi.details("com.nimblebit.tinytower");
    yield* Effect.log(`${item?.title} ${item?.details?.appDetails?.versionString}`);

    const files = yield* GooglePlayApi.downloadToDisk("com.nimblebit.tinytower");
    // ...
}).pipe(Effect.scoped, Effect.provide(PlayLive));
```

### Services

Three things have to be provided.

**A device**, which decides the hardware fingerprint the store sees, and therefore which builds it
will offer. `AndroidDevice.EmbeddedPixel7aLive` ships with the package; other devices can be built
from an Aurora store style properties file with `AndroidDevice.fromPropertiesFile`.

**An `HttpClient`**, from whichever platform package suits the runtime.

**A `PlayAccount`**, which decides how google play credentials are obtained. There is no default, so
pick one of:

- `layerAuroraDispenser(url?)` hands out anonymous credentials from an Aurora store compatible
  dispenser, `https://auroraoss.com/api/auth` by default. The hosted one blocks and rate limits
  datacenter ip ranges, so it is a poor fit for anything running on cloud infrastructure.
- `layerConfig({token?})` reads credentials that were obtained out of band from the config provider,
  defaulting to the `GPLAY_AUTH_TOKEN` environment variable.
- `layerStatic(credentials)` serves credentials that are already in hand.

The device derives auth headers from itself and the account once, then caches them for 30 minutes.
A 401 or a 403 from the store evicts them early, so the next call acquires a
fresh set.
