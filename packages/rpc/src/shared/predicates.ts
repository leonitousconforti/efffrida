import * as Predicate from "effect/Predicate";
import * as String from "effect/String";

import * as constants from "./constants.ts";

export const isClientId = (clientId: number) => Predicate.compose(Predicate.isNumber, (id) => id === clientId);

export const isTaggedForClient = (clientId: number) =>
    Predicate.compose(Predicate.isUnknown, Predicate.struct({ clientId: isClientId(clientId) }));

export const isTaggedForAnyClient = Predicate.compose(
    Predicate.isUnknown,
    Predicate.struct({ clientId: Predicate.isNumber })
);

export const newClientPredicate = Predicate.compose(
    Predicate.isString,
    String.startsWith(constants.nodeRpcClientConnectionRequestMessagePrefix)
);
