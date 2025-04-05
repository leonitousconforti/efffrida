import type * as StreamEmit from "effect/StreamEmit";

import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

/** @internal */
export const memoryAccessMonitorStream = (
    ranges: MemoryAccessRange | Array<MemoryAccessRange>,
    options:
        | { readonly bufferSize: "unbounded" }
        | {
              readonly bufferSize?: number | undefined;
              readonly strategy?: "dropping" | "sliding" | undefined;
          }
        | undefined = { bufferSize: "unbounded" }
): Stream.Stream<MemoryAccessDetails, never, never> =>
    Stream.asyncPush<MemoryAccessDetails>((emit: StreamEmit.EmitOpsPush<never, MemoryAccessDetails>) => {
        const onAccess = (details: MemoryAccessDetails) => emit.single(details);
        const acquire = Effect.sync(() => MemoryAccessMonitor.enable(ranges, { onAccess }));
        const release = (_: void) => Effect.sync(() => MemoryAccessMonitor.disable());
        return Effect.acquireRelease(acquire, release);
    }, options);
