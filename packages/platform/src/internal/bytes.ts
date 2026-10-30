import type * as Array from "effect/Array";

/**
 * Frida only takes an `ArrayBuffer` or an array of numbers, so copy only when
 * the view doesn't cover its buffer.
 *
 * @internal
 */
export const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? (bytes.buffer as ArrayBuffer)
        : bytes.slice().buffer;

/**
 * Concatenates chunks into one `Uint8Array`, without copying a single chunk.
 *
 * @internal
 */
export const concat = (chunks: Array.NonEmptyReadonlyArray<Uint8Array>): Uint8Array => {
    if (chunks.length === 1) return chunks[0];
    let length = 0;
    for (const chunk of chunks) length += chunk.byteLength;
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return bytes;
};
