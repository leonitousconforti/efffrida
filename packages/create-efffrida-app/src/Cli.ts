import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Array from "effect/Array";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { pipe } from "effect/Function";
import { Argument, Command, Flag, Prompt } from "effect/unstable/cli";

import { type ProjectConfig, templates, type TemplateType } from "./Domain.js";
import { GitHub } from "./GitHub.js";
import { validateProjectName } from "./Utils.js";

// =============================================================================
// Version
// =============================================================================

const moduleVersion = "0.0.1";

// =============================================================================
// ANSI helpers
// =============================================================================

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const magenta = (s: string) => `\x1b[35m${s}\x1b[0m`;

// =============================================================================
// CLI Options & Args
// =============================================================================

const projectNameArg = Argument.directory("project-name").pipe(
    Argument.withDescription("The folder to create the efffrida application in"),
    Argument.mapEffect((name) =>
        Effect.gen(function* () {
            yield* validateProjectName(name);
            const path = yield* Path.Path;
            return path.resolve(name);
        })
    ),
    Argument.optional
);

const templateFlag = Flag.choice("template", [...templates]).pipe(
    Flag.withAlias("t"),
    Flag.withDescription("The project template to use: agent-only, app-and-agent, or monorepo"),
    Flag.optional
);

const withVitestFlag = Flag.boolean("vitest").pipe(
    Flag.withDescription("Add Vitest for Node.js unit tests (app-and-agent and monorepo only)")
);

const withVitestPoolFlag = Flag.boolean("vitest-pool").pipe(
    Flag.withDescription("Add @efffrida/vitest-pool for running tests inside Frida")
);

const withWorkflowsFlag = Flag.boolean("workflows").pipe(
    Flag.withDescription("Initialize project with GitHub Actions CI workflows")
);

const withNixFlakeFlag = Flag.boolean("flake").pipe(
    Flag.withDescription("Initialize project with a Nix development shell flake")
);

const withChangesetsFlag = Flag.boolean("changesets").pipe(
    Flag.withDescription("Initialize project with Changesets for versioning (monorepo only)")
);

// =============================================================================
// Command
// =============================================================================

const options = {
    projectName: projectNameArg,
    template: templateFlag,
    withVitest: withVitestFlag,
    withVitestPool: withVitestPoolFlag,
    withWorkflows: withWorkflowsFlag,
    withNixFlake: withNixFlakeFlag,
    withChangesets: withChangesetsFlag,
};

interface RawOptions {
    readonly projectName: Option.Option<string>;
    readonly template: Option.Option<TemplateType>;
    readonly withVitest: boolean;
    readonly withVitestPool: boolean;
    readonly withWorkflows: boolean;
    readonly withNixFlake: boolean;
    readonly withChangesets: boolean;
}

const command = Command.make("create-efffrida-app", options).pipe(
    Command.withDescription("Create an efffrida application from a template"),
    Command.withHandler(handleCommand)
);

export const cli = Command.run(command, { version: `v${moduleVersion}` });

// =============================================================================
// Handler
// =============================================================================

function handleCommand(raw: RawOptions) {
    return Effect.gen(function* () {
        const projectName = yield* resolveProjectName(raw);
        const config = yield* resolveConfig(raw, projectName);
        yield* scaffoldProject(config);
    });
}

function resolveProjectName(raw: RawOptions) {
    return Option.match(raw.projectName, {
        onSome: Effect.succeed,
        onNone: () =>
            Effect.gen(function* () {
                const name = yield* Prompt.text({
                    message: "What is your project named?",
                    default: "my-efffrida-app",
                });
                const path = yield* Path.Path;
                return path.resolve(name);
            }),
    });
}

function resolveConfig(raw: RawOptions, projectName: string) {
    return Effect.gen(function* () {
        const template: TemplateType = yield* Option.match(raw.template, {
            onSome: Effect.succeed,
            onNone: () =>
                Prompt.select<TemplateType>({
                    message: "Which template would you like to use?",
                    choices: [
                        {
                            title: "Agent Only",
                            value: "agent-only",
                            description:
                                "A single Frida agent using @efffrida/platform and FridaRuntime.runMain",
                        },
                        {
                            title: "App & Agent",
                            value: "app-and-agent",
                            description:
                                "A Node.js host app in node/ and a Frida agent in frida/ with separate tsconfigs",
                        },
                        {
                            title: "Monorepo",
                            value: "monorepo",
                            description:
                                "A pnpm monorepo with packages/agent (Frida) and packages/app (Node.js)",
                        },
                    ],
                }),
        });

        const supportsNodeVitest = template === "app-and-agent" || template === "monorepo";
        const supportsChangesets = template === "monorepo";

        const withVitestPool = raw.withVitestPool
            ? true
            : yield* Prompt.toggle({
                  message: "Add @efffrida/vitest-pool for Frida agent tests?",
                  initial: true,
              });

        const withVitest =
            supportsNodeVitest && !raw.withVitest
                ? yield* Prompt.toggle({
                      message: "Add Vitest for Node.js unit tests?",
                      initial: true,
                  })
                : raw.withVitest && supportsNodeVitest;

        const withWorkflows = raw.withWorkflows
            ? true
            : yield* Prompt.toggle({
                  message: "Add GitHub Actions CI workflows?",
                  initial: true,
              });

        const withNixFlake = raw.withNixFlake
            ? true
            : yield* Prompt.toggle({
                  message: "Add a Nix development shell flake?",
                  initial: true,
              });

        const withChangesets =
            supportsChangesets && !raw.withChangesets
                ? yield* Prompt.toggle({
                      message: "Add Changesets for versioning and publishing?",
                      initial: true,
                  })
                : raw.withChangesets && supportsChangesets;

        return {
            projectName,
            template,
            withVitest,
            withVitestPool,
            withWorkflows,
            withNixFlake,
            withChangesets,
        } satisfies ProjectConfig;
    });
}

// =============================================================================
// Scaffolding
// =============================================================================

function scaffoldProject(config: ProjectConfig) {
    return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        yield* Effect.logInfo(
            `Creating a new efffrida application in ${green(config.projectName)}`
        );

        yield* fs.makeDirectory(config.projectName, { recursive: true });

        yield* Effect.logInfo(
            `Initializing project with template: ${magenta(config.template)}`
        );

        const github = yield* GitHub;
        yield* github.downloadTemplate(config);

        yield* postProcess(config, fs, path);

        yield* Effect.logInfo(
            `${green("Success!")} efffrida application created in ${cyan(config.projectName)}`
        );

        const placeholderFiles = getPlaceholderFiles(config, path);
        if (placeholderFiles.length > 0) {
            yield* Effect.logInfo(
                [
                    `Make sure to replace any ${cyan("<PLACEHOLDER>")} entries in the following files:`,
                    ...pipe(
                        placeholderFiles,
                        Array.map((file) => `  - ${file}`)
                    ),
                ].join("\n")
            );
        }

        yield* Effect.logInfo(
            `Get started: ${cyan(`cd ${path.basename(config.projectName)} && pnpm install`)}`
        );
    });
}

function getPlaceholderFiles(config: ProjectConfig, path: Path.Path): Array<string> {
    const pkg = config.projectName;
    const base = path.basename(pkg);
    switch (config.template) {
        case "agent-only":
            return [`${base}/package.json`, `${base}/tsconfig.test.json`];
        case "app-and-agent":
            return [`${base}/package.json`];
        case "monorepo":
            return [
                `${base}/package.json`,
                `${base}/packages/shared/package.json`,
                `${base}/packages/agent/package.json`,
                `${base}/packages/app/package.json`,
            ];
    }
}

// =============================================================================
// Post-processing
// =============================================================================

type JsonObject = Record<string, unknown>;

function postProcess(
    config: ProjectConfig,
    fs: FileSystem.FileSystem,
    path: Path.Path
) {
    return Effect.gen(function* () {
        const pkg = config.projectName;

        // Read root package.json
        const rootPkgPath = path.join(pkg, "package.json");
        const rootPkg = yield* readJson(fs, rootPkgPath);

        // --- Nix ---
        if (!config.withNixFlake) {
            yield* Effect.forEach(["flake.nix", ".envrc"], (f) =>
                fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
            );
        }

        // --- GitHub Actions ---
        if (!config.withWorkflows) {
            yield* fs
                .remove(path.join(pkg, ".github"), { recursive: true })
                .pipe(Effect.ignore);
        }

        // --- Changesets (monorepo only) ---
        if (config.template === "monorepo" && !config.withChangesets) {
            yield* fs
                .remove(path.join(pkg, ".changeset"), { recursive: true })
                .pipe(Effect.ignore);
            yield* fs
                .remove(path.join(pkg, ".github", "workflows", "release.yml"))
                .pipe(Effect.ignore);
            removeDeps(rootPkg, ["@changesets/cli", "@changesets/config"]);
            removeScripts(rootPkg, ["changeset-version", "changeset-publish"]);
        }

        // --- Vitest-Pool ---
        if (!config.withVitestPool) {
            yield* stripVitestPool(config, fs, path);
            removeDeps(rootPkg, ["@efffrida/vitest-pool", "frida"]);
        }

        // --- Vitest (Node.js) ---
        if (!config.withVitest) {
            yield* stripVitest(config, fs, path);
        }

        // --- Shared vitest infra ---
        const needsAnyVitest = config.withVitest || config.withVitestPool;
        if (!needsAnyVitest) {
            yield* Effect.forEach(
                ["vitest.config.ts", "vitest.shared.ts", "vitest.setup.ts"],
                (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
            );
            removeDeps(rootPkg, [
                "vitest",
                "@vitest/coverage-v8",
                "@effect/vitest",
                "vite",
            ]);
            removeScripts(rootPkg, ["test", "coverage"]);
            // Monorepo: also strip the shared package test infrastructure
            if (config.template === "monorepo") {
                yield* Effect.forEach(
                    ["packages/shared/vitest.config.ts", "packages/shared/tsconfig.test.json"],
                    (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
                );
                yield* fs
                    .remove(path.join(pkg, "packages", "shared", "test"), { recursive: true })
                    .pipe(Effect.ignore);
                yield* removeConfigRef(
                    fs,
                    path.join(pkg, "packages", "shared", "tsconfig.json"),
                    "tsconfig.test.json"
                );
                const sharedPkgPath = path.join(pkg, "packages", "shared", "package.json");
                const sharedPkg = yield* readJson(fs, sharedPkgPath);
                removeDeps(sharedPkg, ["@effect/vitest", "@vitest/coverage-v8", "vite", "vitest"]);
                removeScripts(sharedPkg, ["test", "coverage"]);
                yield* writeJson(fs, sharedPkgPath, sharedPkg);
            }
        } else if (config.template === "app-and-agent") {
            // Rewrite root vitest.config.ts for app-and-agent based on what's kept
            const projects: Array<string> = [];
            if (config.withVitestPool) projects.push("frida/vitest.config.ts");
            if (config.withVitest) projects.push("node/vitest.config.ts");
            if (projects.length === 1) {
                yield* fs.writeFileString(
                    path.join(pkg, "vitest.config.ts"),
                    [
                        `import { defineConfig } from "vitest/config";`,
                        ``,
                        `export default defineConfig({`,
                        `    test: {`,
                        `        projects: [${projects.map((p) => `"${p}"`).join(", ")}],`,
                        `    },`,
                        `});`,
                        ``,
                    ].join("\n")
                );
            }
        }

        // Monorepo: strip vitest.shared.ts if no node vitest
        if (config.template === "monorepo" && !config.withVitest) {
            yield* Effect.forEach(
                ["vitest.shared.ts", "vitest.setup.ts"],
                (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
            );
            removeDeps(rootPkg, ["@effect/vitest"]);
        }

        yield* writeJson(fs, rootPkgPath, rootPkg);
    });
}

function stripVitestPool(
    config: ProjectConfig,
    fs: FileSystem.FileSystem,
    path: Path.Path
) {
    const pkg = config.projectName;
    switch (config.template) {
        case "agent-only":
            return Effect.gen(function* () {
                yield* Effect.forEach(
                    ["vitest.config.ts", "tsconfig.test.json"],
                    (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
                );
                yield* fs.remove(path.join(pkg, "test"), { recursive: true }).pipe(Effect.ignore);
                yield* removeConfigRef(fs, path.join(pkg, "tsconfig.json"), "tsconfig.test.json");
            });
        case "app-and-agent":
            return Effect.gen(function* () {
                yield* Effect.forEach(
                    ["frida/vitest.config.ts", "frida/tsconfig.test.json"],
                    (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
                );
                yield* fs
                    .remove(path.join(pkg, "frida", "test"), { recursive: true })
                    .pipe(Effect.ignore);
                yield* removeConfigRef(
                    fs,
                    path.join(pkg, "frida", "tsconfig.json"),
                    "tsconfig.test.json"
                );
            });
        case "monorepo":
            return Effect.gen(function* () {
                yield* Effect.forEach(
                    ["packages/agent/vitest.config.ts", "packages/agent/tsconfig.test.json"],
                    (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
                );
                yield* fs
                    .remove(path.join(pkg, "packages", "agent", "test"), { recursive: true })
                    .pipe(Effect.ignore);
                yield* removeConfigRef(
                    fs,
                    path.join(pkg, "packages", "agent", "tsconfig.json"),
                    "tsconfig.test.json"
                );
                // Update agent package.json
                const agentPkgPath = path.join(pkg, "packages", "agent", "package.json");
                const agentPkg = yield* readJson(fs, agentPkgPath);
                removeDeps(agentPkg, ["@efffrida/vitest-pool", "frida"]);
                removeScripts(agentPkg, ["test", "coverage"]);
                yield* writeJson(fs, agentPkgPath, agentPkg);
            });
    }
}

function stripVitest(
    config: ProjectConfig,
    fs: FileSystem.FileSystem,
    path: Path.Path
) {
    const pkg = config.projectName;
    switch (config.template) {
        case "agent-only":
            return Effect.void;
        case "app-and-agent":
            return Effect.gen(function* () {
                yield* Effect.forEach(
                    ["node/vitest.config.ts", "node/tsconfig.test.json"],
                    (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
                );
                yield* fs
                    .remove(path.join(pkg, "node", "test"), { recursive: true })
                    .pipe(Effect.ignore);
                yield* removeConfigRef(
                    fs,
                    path.join(pkg, "node", "tsconfig.json"),
                    "tsconfig.test.json"
                );
            });
        case "monorepo":
            return Effect.gen(function* () {
                yield* Effect.forEach(
                    ["packages/app/vitest.config.ts", "packages/app/tsconfig.test.json"],
                    (f) => fs.remove(path.join(pkg, f)).pipe(Effect.ignore)
                );
                yield* fs
                    .remove(path.join(pkg, "packages", "app", "test"), { recursive: true })
                    .pipe(Effect.ignore);
                yield* removeConfigRef(
                    fs,
                    path.join(pkg, "packages", "app", "tsconfig.json"),
                    "tsconfig.test.json"
                );
                // Update app package.json
                const appPkgPath = path.join(pkg, "packages", "app", "package.json");
                const appPkg = yield* readJson(fs, appPkgPath);
                removeDeps(appPkg, ["@effect/vitest", "@vitest/coverage-v8", "vite", "vitest"]);
                removeScripts(appPkg, ["test", "coverage"]);
                yield* writeJson(fs, appPkgPath, appPkg);
            });
    }
}

// =============================================================================
// JSON Helpers
// =============================================================================

function readJson(fs: FileSystem.FileSystem, filePath: string) {
    return fs.readFileString(filePath).pipe(Effect.map((s) => JSON.parse(s) as JsonObject));
}

function writeJson(fs: FileSystem.FileSystem, filePath: string, data: JsonObject) {
    return fs.writeFileString(filePath, JSON.stringify(data, undefined, 4) + "\n");
}

function removeDeps(pkg: JsonObject, keys: Array<string>) {
    for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
        const deps = pkg[section] as Record<string, string> | undefined;
        if (deps) {
            for (const key of keys) {
                delete deps[key];
            }
        }
    }
}

function removeScripts(pkg: JsonObject, keys: Array<string>) {
    const scripts = pkg["scripts"] as Record<string, string> | undefined;
    if (scripts) {
        for (const key of keys) {
            delete scripts[key];
        }
    }
}

function removeConfigRef(
    fs: FileSystem.FileSystem,
    tsconfigPath: string,
    refPath: string
) {
    return readJson(fs, tsconfigPath).pipe(
        Effect.flatMap((tsconfig) => {
            const refs = tsconfig["references"] as Array<{ path: string }> | undefined;
            if (refs) {
                tsconfig["references"] = refs.filter((r) => r.path !== refPath);
            }
            return writeJson(fs, tsconfigPath, tsconfig);
        }),
        Effect.ignore
    );
}
