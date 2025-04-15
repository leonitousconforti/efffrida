// import * as Console from "effect/Console";
// import * as Data from "effect/Data";
// import * as Effect from "effect/Effect";
// import * as Sink from "effect/Sink";
// import * as Stream from "effect/Stream";

// import * as FridaStream from "../src/Stream.js";

// export class InputStreamError extends Data.TaggedError("InputStreamError")<{ cause: unknown }> {}

// const startingStream: Stream.Stream<string, never, never> = Stream.make("Hey", ", ", "mom", "!");
// const inputStream: InputStream = startingStream.pipe(FridaStream.encodeText()).pipe(FridaStream.toInputStreamNever);
// const effectStream: Stream.Stream<string, Error, never> = FridaStream.fromInputStream(
//     () => inputStream,
//     (cause) => new InputStreamError({ cause }),
//     { chunkSize: 200 }
// ).pipe(Stream.decodeText());

// const sink = Sink.forEach(Console.log);
// await Effect.runPromise(Stream.run(effectStream, sink));
