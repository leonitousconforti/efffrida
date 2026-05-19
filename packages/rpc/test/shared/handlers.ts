import type { Rpc } from "effect/unstable/rpc";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Stream from "effect/Stream";

import { User, UserRpcs } from "./requests.ts";

// ---------------------------------------------
// Imaginary Database
// ---------------------------------------------

class UserRepository extends Context.Service<UserRepository>()("UserRepository", {
    make: Effect.gen(function* () {
        const ref = yield* Ref.make<Array<User>>([
            new User({ id: "1", name: "Alice" }),
            new User({ id: "2", name: "Bob" }),
        ]);

        return {
            findMany: Ref.get(ref),
            findById: (id: string) =>
                Ref.get(ref).pipe(
                    Effect.flatMap((users) => {
                        const user = users.find((user) => user.id === id);
                        return user ? Effect.succeed(user) : Effect.fail(`User not found: ${id}`);
                    })
                ),
            create: (name: string) =>
                Ref.updateAndGet(ref, (users) => [...users, new User({ id: String(users.length + 1), name })]).pipe(
                    Effect.map((users) => users[users.length - 1]!)
                ),
        };
    }),
}) {
    static readonly layer = Layer.effect(UserRepository, UserRepository.make);
}

// ---------------------------------------------
// RPC handlers
// ---------------------------------------------

export const UsersLive: Layer.Layer<Rpc.Handler<"UserList"> | Rpc.Handler<"UserById"> | Rpc.Handler<"UserCreate">> =
    UserRpcs.toLayer(
        Effect.gen(function* () {
            const db = yield* UserRepository;

            return {
                UserList: () => Stream.fromIterableEffect(db.findMany),
                UserById: ({ id }: { id: string }) => db.findById(id),
                UserCreate: ({ name }: { name: string }) => db.create(name),
            };
        })
    ).pipe(
        // Provide the UserRepository layer
        Layer.provide(UserRepository.layer)
    );
