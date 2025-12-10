import "@efffrida/polyfills";

import { Effect } from "effect";

const program = Effect.gen(function* () {
    yield* Effect.void;
});

Effect.runSync(program);
send("Hello from Effect!");
