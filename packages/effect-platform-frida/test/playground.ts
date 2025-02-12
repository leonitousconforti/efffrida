import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as FridaStream from "../src/Stream.js";

const stream: Stream.Stream<string, never, never> = Stream.make("Hey", ", ", "mom", "!");
const inputStream: InputStream = FridaStream.toInputStreamNever(stream);
const effectStream = FridaStream.fromInputStream(inputStream);

effectStream
    .pipe(Stream.decodeText())
    .pipe(Stream.run(Sink.forEach(Console.log)))
    .pipe(Effect.runFork);
