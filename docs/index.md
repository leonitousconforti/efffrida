---
title: Introduction
permalink: /
nav_order: 1
has_children: false
has_toc: false
---

# Efffrida Monorepo

## Introduction

A compatibility layer between [Frida's JavaScript APIs](https://frida.re/docs/javascript-api/) and [Effect](https://effect.website/).

## Monorepo Structure

The Efffrida monorepo is organized into multiple packages, each extending a different part of effect:

| Package | Description | Links |
| --- | --- | --- |
| `create-efffrida-app` | Scaffold a new efffrida project with a single command | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/create-efffrida-app) |
| `@efffrida/frida-tools` | Acquire Frida devices, spawn and attach to processes, and compile and load agents | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/frida-tools) |
| `@efffrida/gplayapi` | Google Play API client for downloading apps | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/gplayapi) |
| `@efffrida/il2cpp-bridge` | Effect wrappers around frida-il2cpp-bridge | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/il2cpp-bridge) |
| `@efffrida/platform` | Runtime, streams, sinks, sockets and memory access monitoring inside Frida agents | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/platform) |
| `@efffrida/polyfills` | Polyfills for running effect in Frida's GumJS runtime | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/polyfills) |
| `@efffrida/rpc` | `effect/rpc` protocols between Node and Frida agents | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/rpc) |
| `@efffrida/sql` | `effect/sql` driver for Frida's SqliteDatabase | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/sql) |
| `@efffrida/vitest-pool` | Vitest pool that runs tests inside a Frida agent | [README](https://github.com/leonitousconforti/efffrida/tree/main/packages/vitest-pool) |
