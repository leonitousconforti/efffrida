import * as CliError from "effect/cli/CliError";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientRequest from "effect/http/HttpClientRequest";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";

import type { ProjectConfig } from "./Domain.ts";

import * as NodeSink from "@effect/platform-node/NodeSink";
import * as Tar from "tar";

export class GitHub extends Context.Service<GitHub>()("app/GitHub", {
    make: Effect.gen(function* () {
        const client = yield* HttpClient.HttpClient;

        const codeloadBaseUrl = "https://codeload.github.com";

        const codeloadClient = client.pipe(
            HttpClient.filterStatusOk,
            HttpClient.mapRequest(HttpClientRequest.prependUrl(codeloadBaseUrl))
        );

        const downloadTemplate = (config: ProjectConfig) =>
            codeloadClient.get("/leonitousconforti/efffrida/tar.gz/refs/heads/main").pipe(
                HttpClientResponse.stream,
                Stream.run(
                    NodeSink.fromWritable({
                        evaluate: () =>
                            Tar.extract({
                                cwd: config.projectName,
                                strip: 2 + config.template.split("/").length,
                                filter: (path) => path.includes(`efffrida-main/templates/${config.template}`),
                            }) as NodeJS.WritableStream,
                        onError: (_cause) =>
                            new CliError.UserError({
                                cause: `Failed to download template '${config.template}'`,
                            }),
                    })
                )
            );

        return {
            downloadTemplate,
        };
    }),
}) {
    static readonly Default = Layer.effect(GitHub, GitHub.make);
}
