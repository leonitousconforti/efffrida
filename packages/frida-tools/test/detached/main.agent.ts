rpc.exports = {
    ping: () => "pong",
    hang: () => new Promise<never>(() => {}),
};
