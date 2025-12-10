// Global setup must be imported first - it sets globalThis.global
// which is required by abort-controller/polyfill
import "./global-setup.ts";

import "abort-controller/polyfill";
import "core-js/stable/url";
import "event-target-polyfill";
import "fast-text-encoding";
