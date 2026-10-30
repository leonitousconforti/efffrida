/**
 * Frida only sends node Buffers as binary data, other typed arrays get JSON
 * encoded as `{"0": .., "1": ..}`. This is a view, not a copy.
 *
 * @internal
 */
export const toBuffer = (bytes: Uint8Array): Buffer => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
