// import { Effect, Layer, Option, Stream } from "effect";
// import { ChildProcess } from "effect/unstable/process";
// import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

// import { NodeServices } from "@effect/platform-node";
// import { expect, layer } from "@effect/vitest";
// import { FridaDevice, FridaScript, FridaSession } from "@efffrida/frida-tools";
// import { FridaRpcClient } from "@efffrida/rpc/node";
// import { JsPlatform } from "frida";

// import { UserRpcs } from "../../shared/requests.ts";

// // Choose which serialization to use
// const NdJsonSerialization = RpcSerialization.layerNdjson;

// // Choose which protocol to use
// const ProtocolLive = FridaRpcClient.layerProtocolFrida().pipe(Layer.provide(NdJsonSerialization));

// // Pick a device and a session/program
// const DeviceLive = FridaDevice.layerLocalDevice;
// const SessionLive =
//     process.env.CI !== undefined
//         ? FridaSession.layer(["/usr/bin/sleep", "infinity"])
//         : Layer.unwrap(
//               Effect.gen(function* () {
//                   const handle = yield* ChildProcess.make("sleep", ["infinity"]);
//                   return FridaSession.layer(handle.pid);
//               })
//           ).pipe(Layer.provide(NodeServices.layer));

// const FridaLive = Layer.provide(SessionLive, Layer.merge(DeviceLive, NodeServices.layer));

// const ScriptLive = FridaScript.layer(new URL("../../frida/server/agent.ts", import.meta.url), {
//     platform: JsPlatform.Browser,
// }).pipe(Layer.provide(FridaLive));

// const Live = ProtocolLive.pipe(Layer.provide(ScriptLive));

// // Use the client
// layer(Live)("Should be able to perform rpc communication", (it) => {
//     it.effect("demo from rpc readme", () =>
//         Effect.gen(function* () {
//             const client = yield* RpcClient.make(UserRpcs);
//             const user = yield* client.UserById({ id: "1" });
//             expect(user).toEqual({ id: "1", name: "Alice" });
//             let users = yield* client.UserList().pipe(Stream.runCollect);
//             expect(users).toEqual([
//                 { id: "1", name: "Alice" },
//                 { id: "2", name: "Bob" },
//             ]);
//             if (Option.isNone(Option.fromNullishOr(users.find((user) => user.id === "3")))) {
//                 yield* client.UserCreate({ name: "Charlie" });
//                 users = yield* client.UserList().pipe(Stream.runCollect);
//             }
//             expect(users).toEqual([
//                 { id: "1", name: "Alice" },
//                 { id: "2", name: "Bob" },
//                 { id: "3", name: "Charlie" },
//             ]);
//         })
//     );
// });

import { describe } from "vitest";

describe.todo("rpc test", () => {});
