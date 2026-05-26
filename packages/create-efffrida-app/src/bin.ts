#!/usr/bin/env node

import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as References from "effect/References";

import { cli } from "./Cli.js";
import { GitHub } from "./GitHub.js";
import { PrefixLogger } from "./Logger.js";

const MainLive = GitHub.Default.pipe(
    Layer.provideMerge(
        Layer.mergeAll(
            Logger.layer([PrefixLogger]),
            Layer.succeed(References.MinimumLogLevel, "Info"),
            NodeServices.layer,
            NodeHttpClient.layerUndici
        )
    )
);

cli.pipe(
    Effect.provide(MainLive),
    NodeRuntime.runMain({ disableErrorReporting: true })
);
