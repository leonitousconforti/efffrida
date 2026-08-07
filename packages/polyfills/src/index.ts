// Global setup must be imported first - it sets globalThis.global
// which is required by abort-controller/polyfill and by
// text-encoding-utf-8/src/polyfill.js
import "./global-setup.ts";
// @ts-ignore-error
import "abort-controller/polyfill";
import "event-target-polyfill";
// @ts-ignore-error
import "text-encoding-utf-8/src/polyfill.js";
