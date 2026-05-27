import * as Schema from "effect/Schema";

const SCOPED_PACKAGE_REGEX = /^(?:@([^/]+?)[/])?([^/]+?)$/;

// Generated with node -e 'console.log(require("module").builtinModules)'
const nodeBuiltins = [
    "_http_agent",
    "_http_client",
    "_http_common",
    "_http_incoming",
    "_http_outgoing",
    "_http_server",
    "_tls_common",
    "_tls_wrap",
    "assert",
    "assert/strict",
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
    "dns/promises",
    "domain",
    "events",
    "fs",
    "fs/promises",
    "http",
    "http2",
    "https",
    "inspector",
    "inspector/promises",
    "module",
    "net",
    "os",
    "path",
    "path/posix",
    "path/win32",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "readline/promises",
    "repl",
    "stream",
    "stream/consumers",
    "stream/promises",
    "stream/web",
    "string_decoder",
    "sys",
    "timers",
    "timers/promises",
    "tls",
    "trace_events",
    "tty",
    "url",
    "util",
    "util/types",
    "v8",
    "vm",
    "wasi",
    "worker_threads",
    "zlib",
    "node:sea",
    "node:sqlite",
    "node:test",
    "node:test/reporters",
];

export const ProjectNameSchema = Schema.String.check(
    Schema.isMinLength(1, {
        message: "Project name must be a non-empty string",
    }),
    Schema.isMaxLength(214, {
        message: "Project name must not contain more than 214 characters",
    }),
    Schema.isPattern(/^[a-z0-9._-]+$/, {
        message: "Project name must only contain lowercase letters, numbers, dots, underscores, or hyphens",
    }),
    Schema.isPattern(/^[^.].*$/, {
        message: "Project name must not start with a period",
    }),
    Schema.isPattern(/^[^_].*$/, {
        message: "Project name must not start with an underscore",
    }),
    Schema.makeFilter((name) => {
        if (name.trim() !== name) {
            return "Project name must not contain leading or trailing whitespace";
        }
    }),
    Schema.makeFilter((name) => {
        const isNodeBuiltin = nodeBuiltins.some((builtinName) => name.toLowerCase() === builtinName);
        if (isNodeBuiltin) {
            return "Project name must not be a NodeJS built-in module name";
        }
    }),
    Schema.makeFilter((name) => {
        if (encodeURIComponent(name) !== name) {
            const result = name.match(SCOPED_PACKAGE_REGEX);
            if (result) {
                const user = result[1];
                const pkg = result[2];
                if (encodeURIComponent(user) !== user || encodeURIComponent(pkg) !== pkg) {
                    return "Project name must only contain URL-friendly characters";
                }
            }
        }
    })
);
