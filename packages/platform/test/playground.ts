import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

import * as FridaStream from "../src/Stream.js";

type ExampleStream = Stream.Stream<string, FridaStream.InputStreamError, never>;
const startingStream: ExampleStream = Stream.make("Hey", ", ", "mom", "!");
const inputStream: InputStream = startingStream.pipe(FridaStream.encodeText).pipe(FridaStream.toInputStreamNever);
const effectStream: ExampleStream = FridaStream.fromInputStream(inputStream).pipe(Stream.decodeText());

const sink = Sink.forEach(Console.log);
await Effect.runPromise(Stream.run(effectStream, sink));
