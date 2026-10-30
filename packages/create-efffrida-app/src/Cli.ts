import { Effect, FileSystem, Path, Record, Schema } from "effect";
import { Argument, CliError, Command, Flag, Prompt } from "effect/cli";

import { type ProjectConfig, templates } from "./Domain.ts";
import { GitHub } from "./GitHub.ts";
import { ProjectNameSchema } from "./Utils.ts";

/** Injected from package.json at build time, see tsup.config.ts */
declare const __VERSION__: string;

// =============================================================================
// CLI Specification
// =============================================================================

const projectName = Argument.String("project-name").pipe(
    Argument.withFallbackPrompt(
        Prompt.String({
            message: "What is your project named?",
            default: "efffrida-app",
        })
    ),
    Argument.withDescription(
        "The folder to create the efffrida application in, or . to use the current directory (which must be empty)"
    ),
    Argument.mapEffect(
        Effect.fnUntraced(function* (name) {
            const path = yield* Path.Path;
            const directory = path.resolve(name);
            // The package is named after the folder, so "." uses the current directory's name
            const packageName = name === "." ? path.basename(directory) : name;
            yield* Schema.decodeEffect(ProjectNameSchema)(packageName).pipe(
                Effect.mapError(
                    (error) =>
                        new CliError.InvalidValue({
                            option: "project-name",
                            value: name,
                            expected: `a valid package name for '${packageName}': ${error.message}`,
                            kind: "argument",
                        })
                )
            );
            return directory;
        })
    )
);

const templateFlag = Flag.Literals("template", templates).pipe(
    Flag.withDescription("The project template to use"),
    Flag.withFallbackPrompt(
        Prompt.Select({
            message: "Which template would you like to use?",
            choices: [
                {
                    title: "Agent Only",
                    value: "agent-only",
                    description: "A single Frida agent using @efffrida/platform and FridaRuntime.runMain",
                },
                {
                    title: "App & Agent",
                    value: "app-and-agent",
                    description: "A Node.js host app and a Frida agent with separate tsconfigs",
                },
            ] as const,
        })
    )
);

const toggleQuestion = (message: string) =>
    Prompt.Toggle({
        message,
        active: "yes",
        inactive: "no",
        initial: true,
    });

const booleanFlag = (name: string, question: string) =>
    Flag.Boolean(name).pipe(Flag.withDescription(question), Flag.withFallbackPrompt(toggleQuestion(question)));

const withOxcToolsFlag = booleanFlag("oxc-tools", "Add oxlint and oxfmt for linting and formatting?");

const withNodeVitestFlag = booleanFlag("node-vitest", "Add vitest for Node.js unit testing?");

const withFridaVitestFlag = booleanFlag("frida-vitest", "Add @efffrida/vitest-pool for running tests inside Frida?");

const withWorkflowsFlag = booleanFlag("workflows", "Initialize project with GitHub Actions CI workflows?");

const withNixFlakeFlag = booleanFlag("flake", "Initialize project with a Nix flake?");

const withChangesetsFlag = booleanFlag("changesets", "Initialize project with Changesets?");

const refFlag = Flag.String("ref").pipe(
    Flag.withDescription(
        "The branch, tag or commit of the efffrida repository to download the template from, defaults to the release of this version"
    ),
    Flag.withDefault(`refs/tags/create-efffrida-app@${__VERSION__}`)
);

// =============================================================================
// Command
// =============================================================================

const commandConfig = {
    projectName: projectName,
    template: templateFlag,
    withNodeTests: withNodeVitestFlag,
    withFridaTests: withFridaVitestFlag,
    withOxcTools: withOxcToolsFlag,
    withNixFlake: withNixFlakeFlag,
    withChangesets: withChangesetsFlag,
    withWorkflows: withWorkflowsFlag,
    ref: refFlag,
};

const command = Command.make("create-efffrida-app", commandConfig).pipe(
    Command.withDescription("Create an efffrida application from a template repository"),
    Command.withHandler(handleCommand)
);

export const cli = Command.run(command, { version: __VERSION__ });

// =============================================================================
// Handler
// =============================================================================

const PackageJson = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Json), { space: 4 });

const PackageInfo = Schema.fromJsonString(Schema.Struct({ name: Schema.String, version: Schema.String }));

/**
 * Reads the name and version of every package in the downloaded repository, so
 * that the template's `@efffrida/*` dependencies can be pinned to the versions
 * that were released together with it.
 */
const readPackageVersions = Effect.fnUntraced(function* (repository: string) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const packagesDirectory = path.join(repository, "packages");
    const packages = yield* Effect.forEach(yield* fs.readDirectory(packagesDirectory), (name) =>
        Effect.flatMap(
            fs.readFileString(path.join(packagesDirectory, name, "package.json")),
            Schema.decodeEffect(PackageInfo)
        )
    );
    return new Map(packages.map(({ name, version }) => [name, version] as const));
});

const dependencyFields: ReadonlyArray<string> = ["dependencies", "devDependencies", "peerDependencies"];

const isDependencies = Schema.is(Schema.Record(Schema.String, Schema.String));

/** Replaces `latest` ranges with the released version of that package, when known */
const pinVersions = (dependencies: Schema.Json, versions: ReadonlyMap<string, string>): Schema.Json =>
    isDependencies(dependencies)
        ? Record.map<string, string, string>(dependencies, (range, name) =>
              range === "latest" ? (versions.get(name) ?? range) : range
          )
        : dependencies;

function handleCommand(config: ProjectConfig & { readonly ref: string }) {
    return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const github = yield* GitHub;

        if (yield* fs.exists(config.projectName)) {
            const info = yield* fs.stat(config.projectName);
            const isEmptyDirectory =
                info.type === "Directory" && (yield* fs.readDirectory(config.projectName)).length === 0;
            if (!isEmptyDirectory) {
                const message = `Refusing to create a project in ${config.projectName} because it already exists and is not an empty directory`;
                return yield* new CliError.UserError({ cause: message, userMessage: message });
            }
        }

        yield* Effect.logInfo(`Downloading template ${config.template} from ${config.ref}`);
        const repository = yield* github.downloadRepository(config.ref, config.template);

        yield* Effect.logInfo(`Creating a new efffrida application in ${config.projectName}`);
        yield* fs.makeDirectory(config.projectName, { recursive: true });
        yield* fs.copy(path.join(repository, "templates", config.template), config.projectName);

        const versions = yield* readPackageVersions(repository);
        const packageJsonPath = path.join(config.projectName, "package.json");
        const packageJson = yield* Effect.flatMap(fs.readFileString(packageJsonPath), Schema.decodeEffect(PackageJson));
        const updated = yield* Schema.encodeEffect(PackageJson)({
            ...Record.map(packageJson, (value, key) =>
                dependencyFields.includes(key) ? pinVersions(value, versions) : value
            ),
            name: path.basename(config.projectName),
        });
        yield* fs.writeFileString(packageJsonPath, `${updated}\n`);
    }).pipe(Effect.scoped);
}
