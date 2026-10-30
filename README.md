# efffrida

A compatibility layer between [Frida's JavaScript
APIs](https://frida.re/docs/javascript-api/) and
[Effect](https://effect.website/).

| Package                                                | Description                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [`create-efffrida-app`](packages/create-efffrida-app)  | Scaffold a new efffrida project with a single command                             |
| [`@efffrida/frida-tools`](packages/frida-tools)        | Acquire Frida devices, spawn and attach to processes, and compile and load agents |
| [`@efffrida/gplayapi`](packages/gplayapi)              | Google Play API client for downloading apps                                       |
| [`@efffrida/il2cpp-bridge`](packages/il2cpp-bridge)    | Effect wrappers around frida-il2cpp-bridge                                        |
| [`@efffrida/platform`](packages/platform)              | Runtime, streams, sinks, sockets and memory access monitoring inside Frida agents |
| [`@efffrida/polyfills`](packages/polyfills)            | Polyfills for running effect in Frida's GumJS runtime                             |
| [`@efffrida/rpc`](packages/rpc)                        | `effect/rpc` protocols between Node and Frida agents                              |
| [`@efffrida/sql`](packages/sql)                        | `effect/sql` driver for Frida's SqliteDatabase                                    |
| [`@efffrida/vitest-pool`](packages/vitest-pool)        | Vitest pool that runs tests inside a Frida agent                                  |

Get started with `pnpm create efffrida-app`.
