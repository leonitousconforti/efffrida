export const defaultServerMainExportName = "rpc";
export const generateServerExportNameForClient = (clientId: number): string =>
    `@efffrida/rpc/FridaServerRpcListenerForClient/${clientId}`;

let exportIdForClientCallback: number = 0;
export const generateClientCallbackExportNameForServer = (): string =>
    `@efffrida/rpc/FridaClientRpcCallback/${exportIdForClientCallback++}`;

export const nodeRpcClientConnectionRequestMessagePrefix = "client id request message";
export const nodeRpcClientMakeConnectionRequestForServer = (exportName: string) =>
    `${nodeRpcClientConnectionRequestMessagePrefix}:${exportName}`;
