import * as Effect from "effect/Effect";
import * as Queue from "effect/Queue";
import * as Stream from "effect/Stream";

/** @internal */
export const memoryAccessMonitorStream = (
    ranges: MemoryAccessRange | Array<MemoryAccessRange>,
    options?:
        | {
              readonly bufferSize?: number | undefined;
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
          }
        | undefined
): Stream.Stream<MemoryAccessDetails, never, never> =>
    Stream.callback<MemoryAccessDetails>((queue) => {
        const onAccess = (details: MemoryAccessDetails) => Queue.offerUnsafe(queue, details);
        const acquire = Effect.sync(() => MemoryAccessMonitor.enable(ranges, { onAccess }));
        const release = (_: void) => Effect.sync(() => MemoryAccessMonitor.disable());
        return Effect.acquireRelease(acquire, release);
    }, options);
