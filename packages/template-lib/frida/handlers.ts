import type * as Rpc from "@effect/rpc/Rpc";

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Stream from "effect/Stream";

import { User, UserRpcs } from "../shared/requests.js";

// ---------------------------------------------
// Imaginary Database
// ---------------------------------------------

class UserRepository extends Effect.Service<UserRepository>()("UserRepository", {
    effect: Effect.gen(function* () {
        const ref = yield* Ref.make<Array<User>>([
            new User({ id: "1", name: "Alice" }),
            new User({ id: "2", name: "Bob" }),
        ]);

        return {
            findMany: ref.get,
            findById: (id: string) =>
                Ref.get(ref).pipe(
                    Effect.andThen((users) => {
                        const user = users.find((user) => user.id === id);
                        return user ? Effect.succeed(user) : Effect.fail(`User not found: ${id}`);
                    })
                ),
            create: (name: string) =>
                Ref.updateAndGet(ref, (users) => [...users, new User({ id: String(users.length + 1), name })]).pipe(
                    Effect.andThen((users) => users[users.length - 1])
                ),
        };
    }),
}) {}

// ---------------------------------------------
// RPC handlers
// ---------------------------------------------

export const UsersLive: Layer.Layer<Rpc.Handler<"UserList"> | Rpc.Handler<"UserById"> | Rpc.Handler<"UserCreate">> =
    UserRpcs.toLayer(
        Effect.gen(function* () {
            const db = yield* UserRepository;

            return {
                UserList: () => Stream.fromIterableEffect(db.findMany),
                UserById: ({ id }) => db.findById(id),
                UserCreate: ({ name }) => db.create(name),
            };
        })
    ).pipe(
        // Provide the UserRepository layer
        Layer.provide(UserRepository.Default)
    );
