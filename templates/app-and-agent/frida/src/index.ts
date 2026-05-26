import * as Effect from "effect/Effect";

import * as FridaRuntime from "@efffrida/platform/FridaRuntime";

const program = Effect.gen(function* () {
    yield* Effect.log("Agent running inside target process!");
});

rpc.exports = {
    async ping(): Promise<string> {
        return "pong";
    },
};

FridaRuntime.runMain(program);
