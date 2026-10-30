# @efffrida/platform

Effect integrations for the APIs available inside Frida agents.

- `FridaRuntime.runMain` runs the main program of an agent, like
  `NodeRuntime.runMain`. It installs the pretty logger and makes failures show
  up on the host as script errors.
- `Stream`, `Sink` and `Channel` adapt Frida's `InputStream`, `OutputStream` and
  `IOStream` (and the Unix / Win32 variants), plus `receiveStream` and
  `sendSink` for messages from and to the host.
- `Socket` implements `effect/socket/Socket` and `SocketServer` on top of
  Frida's `Socket` API.
- `MemoryAccessMonitor.watch` streams accesses to memory ranges.

```ts
import { Effect, Stream } from "effect";

import { FridaRuntime, MemoryAccessMonitor } from "@efffrida/platform";

const program = Effect.gen(function* () {
    const module = Process.mainModule;
    yield* MemoryAccessMonitor.watch({ base: module.base, size: module.size }).pipe(
        Stream.runForEach((details) => Effect.log(`${details.operation} at ${details.address}`))
    );
});

FridaRuntime.runMain(program);
```

`effect/Path`'s `Path.layer` works in agents as is. There is no `FileSystem`
implementation yet.
