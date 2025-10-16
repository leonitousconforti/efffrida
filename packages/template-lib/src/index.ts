/**
 * Implements a Frida RPC client protocol for effect using the frida script
 * exports. The reason we don't use the send/recv script channels is because
 * those are shared channels by everybody.
 *
 * @since 1.0.0
 */
export * as FridaRpcClient from "./FridaRpcClient.js"

/**
 * Implements a Frida RPC server protocol for effect using the frida script
 * exports. The reason we don't use the send/recv script channels is because
 * those are shared channels by everybody.
 *
 * @since 1.0.0
 */
export * as FridaRpcServer from "./FridaRpcServer.js"
