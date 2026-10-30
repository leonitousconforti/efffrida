import type * as RpcSerialization from "effect/rpc/RpcSerialization";

import * as Schema from "effect/Schema";

/**
 * Encodes defects like effect's own server protocols, so errors survive
 * serialization. Not tagged internal, since stripInternal would drop it from
 * the shared project's declarations, which the frida and node projects build
 * against.
 */
export const makeDefectEncoder = (codecFor: RpcSerialization.CodecFor): ((defect: unknown) => unknown) =>
    Schema.encodeSync(codecFor(Schema.Defect()));
