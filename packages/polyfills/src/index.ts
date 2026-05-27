// Global setup must be imported first - it sets globalThis.global
// which is required by abort-controller/polyfill
import "./global-setup.ts";
// @ts-expect-error
import "abort-controller/polyfill";
import "event-target-polyfill";
import "fast-text-encoding";
