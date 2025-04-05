# efffrida

compatibility layer between [Frida's Javascript API's](https://frida.re/docs/javascript-api/) and various [Effect-ts](https://effect.website/) packages.

## Monorepo Structure

The Effect monorepo is organized into multiple packages, each extending the core functionality. Below is an overview of the packages included:

| Package | Description | Links |
| --------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@efffrida/frida-compile` | Compile frida agents                                                      | [README]()    |
| `@efffrida/frida-tools`   | Connect to devices and launch frida agents                                | [README]()    |
| `@efffrida/il2cpp-bridge` | OpenAI utilities                                                          | [README]()    |
| `@efffrida/platform`      | Platform utilities for Frida                                              | [README]()    |
| `@efffrida/rpc`           | Frida based RPC utilities for building agents                             | [README]()    |
| `@efffrida/sql`           | An `@effect/sql` implementation using the frida SqliteDatabase library    | [README]()    |
