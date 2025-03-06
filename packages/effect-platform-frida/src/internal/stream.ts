import * as Cause from "effect/Cause";
import * as Chunk from "effect/Chunk";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Function from "effect/Function";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Runtime from "effect/Runtime";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import * as Buffer from "node:buffer";
import * as util from "node:util";

/** @internal */
export class InputStreamError extends Data.TaggedError("InputStreamError")<{ cause: unknown }> {}

/** @internal */
export interface BufferAndChunkSizes {
    chunkSize?: number | undefined;
    bufferSize?:
        | number
        | "unbounded"
        | {
              readonly bufferSize?: number | undefined;
              readonly strategy?: "dropping" | "sliding" | "suspend" | undefined;
          }
        | undefined;
}

/** @internal */
export const receiveStream = (
    bufferSize?: BufferAndChunkSizes["bufferSize"] | undefined
): Stream.Stream<{ message: string; data?: Uint8Array | undefined }, never, never> =>
    Stream.async(
        (emit) =>
            Effect.sync(() => {
                while (true) {
                    recv((message: string, data: ArrayBuffer | null) =>
                        emit.single({
                            message: message,
                            data: Predicate.isNotNull(data) ? new Uint8Array(data) : undefined,
                        })
                    ).wait();
                }
            }),
        bufferSize ?? ("unbounded" as const)
    );

/** @internal */
export const fromInputStream = <OnError extends (error: unknown) => any = (error: unknown) => InputStreamError>(
    inputStream: InputStream,
    onError?: OnError | undefined,
    options?: BufferAndChunkSizes | undefined
): Stream.Stream<Uint8Array, ReturnType<OnError>, never> =>
    Stream.asyncScoped(
        Effect.fnUntraced(function* (emit) {
            const resource = yield* Effect.acquireRelease(
                Effect.sync(() => inputStream),
                (inputStream) => Effect.promise(() => inputStream.close())
            );

            yield* Effect.tryPromise({
                try: async function () {
                    while (true) {
                        const chunk = await resource.read(options?.chunkSize ?? 1);
                        if (chunk.byteLength === 0) return await emit.end();
                        else await emit.single(new Uint8Array(chunk));
                    }
                },
                catch: Predicate.isUndefined(onError)
                    ? (error: unknown) => new InputStreamError({ cause: error })
                    : onError,
            });
        }),
        options?.bufferSize ?? ("unbounded" as const)
    );

/** @internal */
export const makeUnixInputStream = <OnError extends (error: unknown) => any = (error: unknown) => InputStreamError>(
    fileDescriptor: number,
    f1?: OnError | undefined,
    options?: (BufferAndChunkSizes & UnixStreamOptions) | undefined
): Stream.Stream<Uint8Array, ReturnType<OnError>, never> =>
    fromInputStream(new UnixInputStream(fileDescriptor, options), f1, options);

/** @internal */
export const makeWin32InputStream = <OnError extends (error: unknown) => any = (error: unknown) => InputStreamError>(
    handle: NativePointerValue,
    f1?: OnError | undefined,
    options?: (BufferAndChunkSizes & WindowsStreamOptions) | undefined
): Stream.Stream<Uint8Array, ReturnType<OnError>, never> =>
    fromInputStream(new Win32InputStream(handle, options), f1, options);

/**
 * Stream adapter for converting an Effect stream to an InputStream. Modified
 * from the effect platform-node toReadable implementation.
 *
 * @internal
 * @link https://github.com/Effect-TS/effect/blob/03c048ced2f7aa2357be52c62ef8e62e9da50817/packages/platform-node-shared/src/internal/stream.ts#L319-L372
 */
class StreamAdapter<E, R> implements InputStream {
    private readonly scope: Scope.CloseableScope;
    private readonly pull: (callback: (error: Error | null, data: Option.Option<number>) => void) => void;

    constructor(
        private readonly runtime: Runtime.Runtime<R>,
        private readonly stream: Stream.Stream<Uint8Array, E, R>
    ) {
        this.scope = Effect.runSync(Scope.make());
        const pull = this.stream.pipe(
            Stream.mapConcat(Function.identity),
            Stream.rechunk(1),
            Stream.toPull,
            Scope.extend(this.scope),
            Runtime.runSync(this.runtime),
            Effect.map(Function.flow(Chunk.head, Option.getOrThrow, Option.some)),
            Effect.catchAll((error) =>
                Option.isNone(error) ? Effect.succeed(Option.none<number>()) : Effect.fail(error.value)
            )
        );
        const runFork = Runtime.runFork(this.runtime);
        this.pull = function (done) {
            runFork(pull).addObserver((exit: Exit.Exit<Option.Option<number>, E>) => {
                done(
                    exit._tag === "Failure"
                        ? new Error("failure in StreamAdapter", { cause: Cause.squash(exit.cause) })
                        : null,
                    exit._tag === "Success" ? exit.value : Option.none<number>()
                );
            });
        };
    }

    private async loop(size: number): Promise<ArrayBuffer> {
        let bytesRead = 0;
        const buffer = Buffer.Buffer.alloc(size);
        const pullAsync = util.promisify(this.pull.bind(this));

        try {
            // Process data in an async loop
            for (let i = 0; i < size; i++) {
                const data = await pullAsync();

                if (Option.isNone(data)) {
                    bytesRead = i;
                    break;
                }

                buffer.writeUInt8(data.value, i);
                bytesRead++;
            }

            if (bytesRead === size) {
                return buffer.buffer;
            } else {
                return Buffer.Buffer.from(buffer.subarray(0, bytesRead)).buffer;
            }
        } catch (error) {
            console.error("error in loop", error);
            await this.close();
            throw error;
        }
    }

    public async close(): Promise<void> {
        const exit = await Runtime.runPromiseExit(this.runtime)(Scope.close(this.scope, Exit.void));
        if (Exit.isFailure(exit)) {
            throw Cause.squash(exit.cause) as any;
        }
    }

    public read(size: number): Promise<ArrayBuffer> {
        return this.loop(size);
    }

    public async readAll(size: number): Promise<ArrayBuffer> {
        const data = await this.loop(size);
        if (data.byteLength < size) {
            const error = new Error("Premature end of stream");
            (error as any).partialData = data;
            throw error;
        }

        return data;
    }
}

/** @internal */
export const toInputStream = <E, R>(stream: Stream.Stream<Uint8Array, E, R>): Effect.Effect<InputStream, never, R> =>
    Effect.map(Effect.runtime<R>(), (runtime) => new StreamAdapter(runtime, stream));

/** @internal */
export const toInputStreamNever = <E>(stream: Stream.Stream<Uint8Array, E, never>): InputStream =>
    new StreamAdapter(Runtime.defaultRuntime, stream);

/** @internal */
export const encodeText = Function.dual<
    (
        encoding?: BufferEncoding | undefined
    ) => <E, R>(self: Stream.Stream<string, E, R>) => Stream.Stream<Uint8Array, E, R>,
    <E, R>(self: Stream.Stream<string, E, R>, encoding?: BufferEncoding | undefined) => Stream.Stream<Uint8Array, E, R>
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], Stream.StreamTypeId),
    <E, R>(self: Stream.Stream<string, E, R>, encoding: BufferEncoding = "utf-8" as const) =>
        Stream.map(self, (chars) => Buffer.Buffer.from(chars, encoding))
);

/** @internal */
export const decodeText = Function.dual<
    (
        encoding?: BufferEncoding | undefined
    ) => <E, R>(self: Stream.Stream<Uint8Array, E, R>) => Stream.Stream<string, E, R>,
    <E, R>(self: Stream.Stream<Uint8Array, E, R>, encoding?: BufferEncoding | undefined) => Stream.Stream<string, E, R>
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], Stream.StreamTypeId),
    <E, R>(self: Stream.Stream<Uint8Array, E, R>, encoding: BufferEncoding = "utf-8" as const) =>
        Stream.map(self, (chars) => Buffer.Buffer.from(chars.buffer).toString(encoding))
);
