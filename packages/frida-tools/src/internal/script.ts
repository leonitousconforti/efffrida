import type * as Scope from "effect/Scope";
import type * as Frida from "frida";
import type * as FridaScript from "../FridaScript.js";

import { Take } from "effect";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Predicate from "effect/Predicate";
import * as Queue from "effect/Queue";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";
import * as FridaDevice from "../FridaDevice.js";
import * as FridaSession from "../FridaSession.js";
import * as FridaSessionError from "../FridaSessionError.js";

/** @internal */
export const FridaScriptTypeId: FridaScript.FridaScriptTypeId = Symbol.for(
    "@efffrida/frida-tools/FridaScript"
) as FridaScript.FridaScriptTypeId;

/** @internal */
export const Tag = Context.GenericTag<FridaScript.FridaScript>("@efffrida/frida-tools/FridaScript");

/** @internal */
export const isFridaScript = (u: unknown): u is FridaScript.FridaScript => Predicate.hasProperty(u, FridaScriptTypeId);

/** @internal */
export const load: (
    source: string | Buffer,
    options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
) => Effect.Effect<
    FridaScript.FridaScript,
    FridaSessionError.FridaSessionError,
    FridaSession.FridaSession | FridaDevice.FridaDevice | Scope.Scope
> = Effect.fnUntraced(
    function* (
        source: string | Buffer,
        options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
    ) {
        const { device } = yield* FridaDevice.FridaDevice;
        const { session } = yield* FridaSession.FridaSession;

        const script = Predicate.isString(source)
            ? yield* Effect.tryPromise({
                  try: () => session.createScript(source, options),
                  catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "compile" }),
              })
            : yield* Effect.tryPromise({
                  try: () => session.createScriptFromBytes(source, options),
                  catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "compile" }),
              });

        const queue =
            yield* Queue.unbounded<
                Take.Take<{ message: any; data: Option.Option<Buffer> }, FridaSessionError.FridaSessionError>
            >();

        const handler: Frida.ScriptMessageHandler = (message: Frida.Message, data: Buffer | null): void => {
            if (message.type === "error") {
                Queue.unsafeOffer(
                    queue,
                    Take.fail(
                        new FridaSessionError.FridaSessionError({
                            when: "message",
                            cause: {
                                stack: message.stack,
                                fileName: message.fileName,
                                lineNumber: message.lineNumber,
                                columnNumber: message.columnNumber,
                                description: message.description,
                            },
                        })
                    )
                );
            } else if (message.type === "send") {
                Queue.unsafeOffer(
                    queue,
                    Take.of({
                        message: message.payload,
                        data: Option.fromNullable(data),
                    })
                );
            }
        };

        script.message.connect(handler);
        const disconnectHandler = Effect.sync(() => script.message.disconnect(handler));
        yield* Effect.addFinalizer(() => Effect.flatMap(queue.shutdown, () => disconnectHandler));

        const stream = Stream.fromQueue(queue).pipe(Stream.flattenTake);
        const sink = Sink.forEach<{ message: any; data: Option.Option<Buffer> }, void, never, never>(
            ({ data, message }) => Effect.sync(() => script.post(message, Option.getOrNull(data)))
        );

        yield* Effect.tryPromise({
            try: () => script.load(),
            catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "load" }),
        });

        if (options?.resume === true) {
            yield* Effect.tryPromise({
                try: () => device.resume(session.pid),
                catch: (cause) => new FridaSessionError.FridaSessionError({ cause, when: "resume" }),
            });
        }

        return {
            script,
            stream,
            sink,
            [FridaScriptTypeId]: FridaScriptTypeId,
        } as const;
    },
    Effect.acquireRelease(({ script }: FridaScript.FridaScript) => Effect.promise(() => script.unload()))
);

/** @internal */
export const layer = (
    source: string,
    options?: (Frida.ScriptOptions & { readonly resume?: boolean | undefined }) | undefined
) => Layer.scoped(Tag, load(source, options));
