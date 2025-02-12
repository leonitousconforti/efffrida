import * as Cause from "effect/Cause";
import * as Channel from "effect/Channel";
import * as Chunk from "effect/Chunk";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Function from "effect/Function";
import * as AsyncInput from "effect/SingleProducerAsyncInput";
import * as Sink from "effect/Sink";

/** @internal */
export const fromOutputStreamChannel = <IE, OE, A>(
    evaluate: Function.LazyArg<OutputStream>,
    onError: (error: unknown) => OE
): Channel.Channel<Chunk.Chunk<never>, Chunk.Chunk<A>, IE | OE, IE, void, unknown, never> =>
    Channel.flatMap(
        Effect.zip(
            Effect.sync(() => evaluate()),
            Deferred.make<void, IE | OE>()
        ),
        ([writable, deferred]) =>
            Channel.embedInput(
                writableOutput(writable, deferred, onError),
                writeInput<IE, A>(
                    writable,
                    (cause) => Deferred.failCause(deferred, cause),
                    options,
                    Deferred.complete(deferred, Effect.void)
                )
            )
    );

export const fromOutputStream = <E, A = Uint8Array>(
    evaluate: Function.LazyArg<OutputStream>,
    onError: (error: unknown) => E
): Sink.Sink<void, A, never, E, never> => Sink.fromChannel(fromOutputStreamChannel(evaluate, onError));

/** @internal */
export const makeUnixOutputStream = <E>(
    fileDescriptor: number,
    onError: (error: unknown) => E,
    options?: UnixStreamOptions | undefined
): Sink.Sink<void, Uint8Array, never, E, never> =>
    fromOutputStream(() => new UnixOutputStream(fileDescriptor, options), onError);

/** @internal */
export const makeWin32OutputStream = <E>(
    handle: NativePointerValue,
    onError: (error: unknown) => E,
    options?: WindowsStreamOptions | undefined
): Sink.Sink<void, Uint8Array, never, E, never> =>
    fromOutputStream(() => new Win32OutputStream(handle, options), onError);

/** @internal */
export const writableOutput = <IE, E>(
    writable: OutputStream,
    deferred: Deferred.Deferred<void, IE | E>,
    onError: (error: unknown) => E
) =>
    Effect.suspend(() => {
        function handleError(err: unknown) {
            Deferred.unsafeDone(deferred, Effect.fail(onError(err)));
        }
        // writable.on("error", handleError);
        return Effect.ensuring(
            Deferred.await(deferred),
            Effect.sync(() => {
                // writable.removeListener("error", handleError);
            })
        );
    });

/** @internal */
export const writeInput = <IE, A>(
    writable: OutputStream,
    onFailure: (cause: Cause.Cause<IE>) => Effect.Effect<void>,
    { encoding, endOnDone = true }: FromWritableOptions = {},
    onDone = Effect.void
): AsyncInput.AsyncInputProducer<IE, Chunk.Chunk<A>, unknown> => {
    const write = writeEffect(writable, encoding);
    const close = endOnDone
        ? Effect.async<void>((resume) => {
              if ("closed" in writable && writable.closed) {
                  resume(Effect.void);
              } else {
                  writable.once("finish", () => resume(Effect.void));
                  writable.end();
              }
          })
        : Effect.void;
    return {
        awaitRead: () => Effect.void,
        emit: write,
        error: (cause) => Effect.zipRight(close, onFailure(cause)),
        done: (_) => Effect.zipRight(close, onDone),
    };
};

/** @internal */
export const writeEffect =
    <A>(writable: OutputStream, encoding?: BufferEncoding) =>
    (chunk: Chunk.Chunk<A>) =>
        chunk.length === 0
            ? Effect.void
            : Effect.async<void>((resume) => {
                  const iterator = chunk[Symbol.iterator]();
                  let next = iterator.next();
                  function loop() {
                      const item = next;
                      next = iterator.next();
                      const success = writable.write(item.value, encoding as any);
                      if (next.done) {
                          resume(Effect.void);
                      } else if (success) {
                          loop();
                      } else {
                          writable.once("drain", loop);
                      }
                  }
                  loop();
              });
