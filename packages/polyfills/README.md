# @efffrida/polyfills

Polyfills for using effect-ts in frida's GumJS environment.

Frida's script runtimes are missing some globals that effect (and libraries
built on it) expect. Importing this package installs them on `globalThis`:

- `global`, as an alias of `globalThis`
- `TextEncoder` and `TextDecoder` (UTF-8 only), from
  [text-encoding-utf-8](https://www.npmjs.com/package/text-encoding-utf-8)
- `AbortController` and `AbortSignal`, from
  [abort-controller](https://www.npmjs.com/package/abort-controller)
- `Event` and `EventTarget`, from
  [event-target-polyfill](https://www.npmjs.com/package/event-target-polyfill)
- `performance`, with `timeOrigin` and a millisecond `now()` based on `Date`

Apart from `global`, each one is only installed when the runtime doesn't
already provide it.

## Usage

Import it for its side effects as the very first import of the agent, before
effect or any other package:

```ts
import "@efffrida/polyfills";

import * as Effect from "effect/Effect";

import { FridaRuntime } from "@efffrida/platform";

FridaRuntime.runMain(Effect.log("Hello from the agent"));
```

Imports are evaluated in order, so a module imported before the polyfills can
read a missing global while it is being evaluated and fail to load.
