import * as NodeSink from "@effect/platform-node/NodeSink";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import * as Tar from "tar";

import type { ProjectConfig } from "./Domain.js";

export class TemplateDownloadError extends Data.TaggedError("TemplateDownloadError")<{
    readonly template: string;
    readonly cause: unknown;
}> {
    override get message(): string {
        return `Failed to download template '${this.template}'`;
    }
}

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
                                filter: (path) =>
                                    path.includes(`efffrida-main/templates/${config.template}`),
                            }) as unknown as NodeJS.WritableStream,
                        onError: (cause) => new TemplateDownloadError({ template: config.template, cause }),
                    })
                )
            );

        return { downloadTemplate };
    }),
}) {
    static readonly Default = Layer.effect(GitHub, GitHub.make);
}
