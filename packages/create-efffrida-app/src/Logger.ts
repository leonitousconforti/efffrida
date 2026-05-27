import * as Array from "effect/Array";
import * as Logger from "effect/Logger";

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

export const PrefixLogger = Logger.make(({ message }) => {
    const messageArr = Array.ensure(message);
    for (let i = 0; i < messageArr.length; i++) {
        const msg = messageArr[i];
        if (typeof msg === "string" && msg.length > 0) {
            const prefix = cyan("[create-efffrida-app]:");
            globalThis.console.log(`${prefix} ${msg}`);
        }
    }
});
