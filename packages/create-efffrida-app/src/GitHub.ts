import * as CliError from "effect/cli/CliError";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientRequest from "effect/http/HttpClientRequest";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";

import type { TemplateType } from "./Domain.ts";

import * as NodeSink from "@effect/platform-node/NodeSink";
import * as Tar from "tar";

/**
 * Whether a path from the repository tarball is needed to scaffold the
 * template: the template itself plus the package.json of every package, which
 * is where the template's `@efffrida/*` versions are read from.
 */
const isNeeded = (tarballPath: string, template: TemplateType): boolean => {
    // The first segment is the tarball's top level directory, e.g.
    // efffrida-main
    const [, root, name, file, ...rest] = tarballPath.split("/");
    return (
        (root === "templates" && name === template) ||
        (root === "packages" && file === "package.json" && rest.length === 0)
    );
};

export class GitHub extends Context.Service<GitHub>()("create-efffrida-app/GitHub", {
    make: Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const codeloadClient = (yield* HttpClient.HttpClient).pipe(
            HttpClient.filterStatusOk,
            HttpClient.mapRequest(
                HttpClientRequest.prependUrl("https://codeload.github.com/leonitousconforti/efffrida")
            )
        );

        /**
         * Downloads the efffrida repository at `ref` into a scoped temporary
         * directory, keeping the repository layout but only the files that
         * {@link isNeeded} selects. Returns the temporary directory.
         */
        const downloadRepository = Effect.fn("GitHub.downloadRepository")(function* (
            ref: string,
            template: TemplateType
        ) {
            const directory = yield* fs.makeTempDirectoryScoped({ prefix: "create-efffrida-app-" });
            yield* codeloadClient.get(`/tar.gz/${ref}`).pipe(
                HttpClientResponse.stream,
                Stream.run(
                    NodeSink.fromWritable({
                        evaluate: () =>
                            Tar.extract({
                                cwd: directory,
                                strip: 1,
                                filter: (path) => isNeeded(path, template),
                            }) as NodeJS.WritableStream,
                        onError: (cause) => cause,
                    })
                ),
                Effect.mapError(
                    (cause) =>
                        new CliError.UserError({
                            cause,
                            userMessage: `Failed to download template '${template}' from ref '${ref}' of the efffrida repository, use --ref to pick another branch, tag or commit`,
                        })
                )
            );
            return directory;
        });

        return {
            downloadRepository,
        } as const;
    }),
}) {
    static readonly layer = Layer.effect(this, this.make);
}
