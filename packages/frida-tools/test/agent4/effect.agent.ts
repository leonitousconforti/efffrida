import "@efffrida/polyfills";

import { Effect } from "effect";

const program = Effect.void;

Effect.runSync(program);
send("Hello from Effect!");
