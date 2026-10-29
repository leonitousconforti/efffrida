import "@efffrida/polyfills";

import { Effect, Stream, Layer } from "effect";
import { RpcSerialization, RpcClient } from "effect/rpc";

import { FridaRuntime } from "@efffrida/platform";
import { FridaRpcClient } from "@efffrida/rpc/frida";

import { UserRpcs, CallbackRpcs } from "../../shared/requests.ts";

// Choose the protocol and serialization format
const NdJsonSerialization = RpcSerialization.layerNdjson;
const FridaProtocol = FridaRpcClient.layerProtocolFrida.pipe(Layer.provide(NdJsonSerialization));

const program = Effect.gen(function* () {
    const usersClient = yield* RpcClient.make(UserRpcs);
    const callbacksClient = yield* RpcClient.make(CallbackRpcs);

    const user = yield* usersClient.UserById({ id: "1" });
    yield* callbacksClient.Callback(user);

    let users = yield* usersClient.UserList().pipe(Stream.runCollect);
    yield* callbacksClient.Callback(users);

    if (users.find((user) => user.id === "3") === undefined) {
        yield* usersClient.UserCreate({ name: "Charlie" });
        users = yield* usersClient.UserList().pipe(Stream.runCollect);
        yield* callbacksClient.Callback(users);
    }
});

program.pipe(Effect.scoped, Effect.provide(FridaProtocol), FridaRuntime.runMain);
