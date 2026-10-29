/**
 * @since 1.0.0
 */

/**
 * Effect `Channel` utilities for Frida.
 *
 * @since 1.0.0
 */
export * as Channel from "./Channel.ts"

/**
 * Effect `Runtime` utilities for Frida.
 *
 * @since 1.0.0
 */
export * as FridaRuntime from "./FridaRuntime.ts"

/**
 * Frida `Memory Access Monitor` utilities for Effect.
 *
 * @since 1.0.0
 */
export * as MemoryAccessMonitor from "./MemoryAccessMonitor.ts"

/**
 * Effect `Sink` utilities for Frida.
 *
 * @since 1.0.0
 */
export * as Sink from "./Sink.ts"

/**
 * Effect `Socket` utilities for Frida.
 *
 * Sockets read with backpressure: at most one `InputStream.read` is in flight
 * and only while the consumer is pulling. As with every Effect 4 socket, any
 * close, including end of stream (code 1000), fails the reader with a
 * `SocketError` wrapping a `SocketCloseError`. Frida streams have no
 * half-close, so releasing the writer does not signal end of stream to the
 * peer; write a `Socket.CloseEvent` or close the reader scope instead.
 *
 * @since 1.0.0
 */
export * as Socket from "./Socket.ts"

/**
 * Effect `Stream` utilities for Frida.
 *
 * @since 1.0.0
 */
export * as Stream from "./Stream.ts"
