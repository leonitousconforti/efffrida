import { init, runBaseTests } from "vitest/worker";

init({
    post: (rpcResponse) => {
        send(rpcResponse);
    },
    on: (rpcListener) => {
        rpc.exports["onMessage"] = (message: unknown) => {
            rpcListener(message);
        };
    },
    off: (_callback) => {
        delete rpc.exports["onMessage"];
    },
    runTests: (state) => runBaseTests("run", state),
    collectTests: (state) => runBaseTests("collect", state),
});
