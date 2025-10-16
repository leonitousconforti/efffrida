# efffrida

compatibility layer between [Frida's Javascript API's](https://frida.re/docs/javascript-api/) and various [Effect-ts](https://effect.website/) packages.

## Monorepo Structure

The Efffrida monorepo is organized into multiple packages, each extending a different part of effect. Below is an overview of the packages included:

| Package | Description | Links |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@efffrida/frida-tools`   | Connect to devices and launch frida agents                                | [README]()    |
| `@efffrida/il2cpp-bridge` | WIP                                                                       | [README]()    |
| `@efffrida/platform`      | Platform utilities for Frida                                              | [README]()    |
| `@efffrida/rpc`           | An `@effect/rpc` implementation for building agents                       | [README]()    |
| `@efffrida/sql`           | An `@effect/sql` implementation using the frida SqliteDatabase library    | [README]()    |

## Docs

https://leoconforti.pages.ltgk.net/efffrida/
