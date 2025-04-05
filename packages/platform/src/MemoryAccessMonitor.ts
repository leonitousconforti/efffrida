/**
 * Frida `Memory Access Monitor` utilities for Effect.
 *
 * @since 1.0.0
 */

import type * as Stream from "effect/Stream";

import * as internal from "./internal/memoryAccessMonitor.js";

/**
 * Starts monitoring one or more memory ranges for access, and notifies on the
 * first access of each contained memory page. Stops monitoring when the stream
 * is interrupted or the stream is finished.
 *
 * @since 1.0.0
 * @category Memory Access Monitor
 */
export const MemoryAccessMonitorStream: (
    ranges: MemoryAccessRange | Array<MemoryAccessRange>,
    options?:
        | { readonly bufferSize: "unbounded" }
        | {
              readonly bufferSize?: number | undefined;
              readonly strategy?: "dropping" | "sliding" | undefined;
          }
        | undefined
) => Stream.Stream<MemoryAccessDetails, never, never> = internal.memoryAccessMonitorStream;
