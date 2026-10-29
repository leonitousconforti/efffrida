/**
 * Constants for working with RPC servers and clients.
 *
 * @since 1.0.0
 */

export const defaultServerMainExportName = "rpc";
export const generateServerExportNameForClient = (clientId: number): string =>
    `@efffrida/rpc/FridaServerRpcListenerForClient/${clientId}`;

export const nodeRpcClientConnectionRequestMessagePrefix = "@efffrida/rpc/NodeRpcClientConnectionRequest/";
export const nodeRpcClientMakeConnectionRequestForServer = (exportName: string) =>
    `${nodeRpcClientConnectionRequestMessagePrefix}${exportName}`;

export const nodeRpcClientDisconnectionRequestMessagePrefix = "@efffrida/rpc/NodeRpcClientDisconnectionRequest/";
export const nodeRpcClientMakeDisconnectionRequestForServer = (exportName: string) =>
    `${nodeRpcClientDisconnectionRequestMessagePrefix}${exportName}`;

export const fridaRpcServerResponseMessagePrefix = "@efffrida/rpc/FridaRpcServerResponse/";
export const fridaRpcServerMakeResponseMessageForClient = (exportName: string) =>
    `${fridaRpcServerResponseMessagePrefix}${exportName}`;
