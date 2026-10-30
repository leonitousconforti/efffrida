import "./global-setup.ts";
import "./performance.ts";
// @ts-expect-error abort-controller ships no types for its polyfill entrypoint
import "abort-controller/polyfill";
import "event-target-polyfill";
import "text-encoding-utf-8/src/polyfill.js";
