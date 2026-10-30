/**
 * Frida `Memory Access Monitor` utilities for Effect.
 *
 * @since 1.0.0
 */

import type * as Stream from "effect/Stream";

import * as internal from "./internal/memoryAccessMonitor.ts";

/**
 * Monitors one or more memory ranges for access, and emits on the first access
 * of each contained memory page. Stops monitoring when the stream is
 * interrupted or the stream is finished. The buffer is unbounded by default;
 * with a `bufferSize`, accesses that arrive while it is full are dropped, or
 * evict the oldest one with the `"sliding"` strategy.
 *
 * @since 1.0.0
 * @category Memory Access Monitor
 */
export const watch: (
    ranges: MemoryAccessRange | Array<MemoryAccessRange>,
    options?:
        | {
              readonly bufferSize?: number | undefined;
              readonly strategy?: "sliding" | "dropping" | undefined;
          }
        | undefined
) => Stream.Stream<MemoryAccessDetails, never, never> = internal.watch;
