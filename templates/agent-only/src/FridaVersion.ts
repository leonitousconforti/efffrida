import { Context, Effect, Layer } from "effect";

export class FridaVersion extends Context.Service<
    FridaVersion,
    {
        version: Effect.Effect<string, never, never>;
    }
>()("FridaVersion", {
    make: Effect.succeed({
        version: Effect.sync(() => Frida.version),
    }),
}) {
    static readonly layer = Layer.effect(this, this.make);
}
