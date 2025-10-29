import type * as Duration from "effect/Duration";
import type { FromInputStreamOptions } from "../Stream.ts";

import * as Cause from "effect/Cause";
import * as Chunk from "effect/Chunk";
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
export const receiveStream = (
    shareOptions:
        | {
              readonly capacity: "unbounded";
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.DurationInput | undefined;
          }
        | {
              readonly capacity: number;
              readonly strategy?: "sliding" | "dropping" | "suspend" | undefined;
              readonly replay?: number | undefined;
              readonly idleTimeToLive?: Duration.DurationInput | undefined;
          }
): Effect.Effect<
    Stream.Stream<
        {
            message: string;
            data?: Uint8Array | undefined;
        },
        never,
        never
    >,
    never,
    Scope.Scope
> =>
    Stream.fromPull(
        Effect.sync(() =>
            Effect.async<Chunk.Chunk<{ message: string; data?: Uint8Array | undefined }>, Option.None<never>, never>(
                (resume) => {
                    recv((message: string, data: ArrayBuffer | null): void => {
                        resume(
                            Effect.succeed(
                                Chunk.make({
                                    message,
                                    data: Predicate.isNotNull(data) ? new Uint8Array(data) : undefined,
                                })
                            )
                        );
                    });
                }
            )
        )
    ).pipe(Stream.share(shareOptions));

/** @internal */
export const fromInputStream = <E>(
    inputStream: Function.LazyArg<InputStream>,
    onError: (error: unknown) => E,
    options?: FromInputStreamOptions | undefined
): Stream.Stream<Uint8Array, E, never> =>
    Stream.fromPull(
        Effect.gen(function* () {
            const acquire = Effect.sync(inputStream);
            const release = (inputStream: InputStream) => Effect.promise(() => inputStream.close());
            const resource = yield* Effect.acquireRelease(acquire, release);

            return Effect.tryPromise({
                async try() {
                    const buffer = await resource.read(options?.chunkSize ? Number(options.chunkSize) : 1);
                    return new Uint8Array(buffer);
                },
                catch: Function.flow(onError, Option.some),
            }).pipe(
                Effect.flatMap((data) => {
                    if (data.length > 0) {
                        return Effect.succeed(Chunk.make(data));
                    } else {
                        return Effect.fail(Option.none<E>());
                    }
                })
            );
        })
    );

/** @internal */
export const makeUnixInputStream = <E>(
    fileDescriptor: number,
    onError: (error: unknown) => E,
    options?: (FromInputStreamOptions & UnixStreamOptions) | undefined
): Stream.Stream<Uint8Array, E, never> =>
    fromInputStream(() => new UnixInputStream(fileDescriptor, options), onError, options);

/** @internal */
export const makeWin32InputStream = <E>(
    handle: NativePointerValue,
    onError: (error: unknown) => E,
    options?: (FromInputStreamOptions & WindowsStreamOptions) | undefined
): Stream.Stream<Uint8Array, E, never> =>
    fromInputStream(() => new Win32InputStream(handle, options), onError, options);

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

    private readonly runtime: Runtime.Runtime<R>;
    private readonly stream: Stream.Stream<Uint8Array, E, R>;

    constructor(_runtime: Runtime.Runtime<R>, _stream: Stream.Stream<Uint8Array, E, R>) {
        this.runtime = _runtime;
        this.stream = _stream;
        this.scope = Effect.runSync(Scope.make());
        const pull = this.stream.pipe(
            Stream.mapConcat(Function.identity),
            Stream.rechunk(1),
            Stream.toPull,
            Scope.extend(this.scope),
            Runtime.runSync(this.runtime),
            Effect.map(Function.flow(Chunk.unsafeHead, Option.some)),
            Effect.catchAll((error) =>
                Option.isNone(error) ? Effect.succeed(Option.none<number>()) : Effect.fail(error.value)
            )
        );
        this.pull = function (done) {
            Runtime.runFork(this.runtime)(pull).addObserver((exit: Exit.Exit<Option.Option<number>, E>) => {
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
                const newBuffer = Buffer.Buffer.alloc(bytesRead);
                buffer.copy(newBuffer, 0, 0, bytesRead);
                return newBuffer.buffer;
            }
        } catch (error) {
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
    <E, R>(
        self: Stream.Stream<string, E, R>,
        encoding: BufferEncoding = "utf-8" as const
    ): Stream.Stream<Uint8Array, E, R> => Stream.map(self, (chars) => Buffer.Buffer.from(chars, encoding))
);

/** @internal */
export const decodeText = Function.dual<
    (
        encoding?: BufferEncoding | undefined
    ) => <E, R>(self: Stream.Stream<Uint8Array, E, R>) => Stream.Stream<string, E, R>,
    <E, R>(self: Stream.Stream<Uint8Array, E, R>, encoding?: BufferEncoding | undefined) => Stream.Stream<string, E, R>
>(
    (arguments_) => Predicate.hasProperty(arguments_[0], Stream.StreamTypeId),
    <E, R>(
        self: Stream.Stream<Uint8Array, E, R>,
        encoding: BufferEncoding = "utf-8" as const
    ): Stream.Stream<string, E, R> => Stream.map(self, (chars) => Buffer.Buffer.from(chars.buffer).toString(encoding))
);
