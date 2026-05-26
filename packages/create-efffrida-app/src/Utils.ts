import { CliError } from "effect/unstable/cli";

const SCOPED_PACKAGE_REGEX = /^(?:@([^/]+?)[/])?([^/]+?)$/;

const blockList = ["node_modules", "favicon.ico"];

const nodeBuiltins = [
    "assert",
    "async_hooks",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "diagnostics_channel",
    "dns",
    "domain",
    "events",
    "fs",
    "http",
    "http2",
    "https",
    "inspector",
    "module",
    "net",
    "os",
    "path",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "string_decoder",
    "sys",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "v8",
    "vm",
    "worker_threads",
    "zlib",
];

import * as Effect from "effect/Effect";

const invalid = (name: string, expected: string) =>
    Effect.fail(new CliError.InvalidValue({ option: "project-name", value: name, expected, kind: "argument" }));

export function validateProjectName(name: string): Effect.Effect<string, CliError.InvalidValue> {
    if (name.length === 0) {
        return invalid(name, "non-empty string");
    }
    if (name.length > 214) {
        return invalid(name, "at most 214 characters");
    }
    if (name.toLowerCase() !== name) {
        return invalid(name, "no capital letters");
    }
    if (name.trim() !== name) {
        return invalid(name, "no leading or trailing whitespace");
    }
    if (name.match(/^\./)) {
        return invalid(name, "must not start with a period");
    }
    if (name.match(/^_/)) {
        return invalid(name, "must not start with an underscore");
    }
    if (/[~'!()*]/.test(name.split("/").slice(-1)[0]!)) {
        return invalid(name, "must not contain the special characters ~'!()*");
    }
    const isNodeBuiltin = nodeBuiltins.some((builtinName) => name.toLowerCase() === builtinName);
    if (isNodeBuiltin) {
        return invalid(name, "must not be a NodeJS built-in module name");
    }
    const isBlockedName = blockList.some((blockedName) => name.toLowerCase() === blockedName);
    if (isBlockedName) {
        return invalid(name, `must not be the blocked name '${name}'`);
    }
    if (encodeURIComponent(name) !== name) {
        const result = name.match(SCOPED_PACKAGE_REGEX);
        if (result) {
            const user = result[1];
            const pkg = result[2];
            if (
                (user !== undefined && encodeURIComponent(user) !== user) ||
                (pkg !== undefined && encodeURIComponent(pkg) !== pkg)
            ) {
                return invalid(name, "URL-friendly characters only");
            }
        }
    }
    return Effect.succeed(name);
}
