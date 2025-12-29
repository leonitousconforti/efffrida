/**
 * @since 1.0.0
 * @category Equivalence
 */

import * as Equivalence from "effect/Equivalence";

/**
 * @since 1.0.0
 * @category Equivalence
 */
export const nativePointer = Equivalence.make<NativePointer>((self, that) => self.equals(that));

/**
 * @since 1.0.0
 * @category Equivalence
 */
export const image = Equivalence.mapInput(nativePointer, (image: Il2Cpp.Image) => image.handle);

/**
 * @since 1.0.0
 * @category Equivalence
 */
const class_ = Equivalence.mapInput(nativePointer, (klass: Il2Cpp.Class) => klass.handle);

export {
    /**
     * @since 1.0.0
     * @category Equivalence
     */
    class_ as class,
};

/**
 * @since 1.0.0
 * @category Equivalence
 */
export const field = Equivalence.mapInput(nativePointer, (field: Il2Cpp.Field) => field.handle);

/**
 * @since 1.0.0
 * @category Equivalence
 */
export const method = Equivalence.mapInput(nativePointer, (method: Il2Cpp.Method) => method.handle);
