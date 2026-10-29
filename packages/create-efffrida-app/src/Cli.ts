import { Effect, Path, FileSystem, Schema } from "effect";
import { Argument, CliError, Command, Flag, Prompt } from "effect/cli";

import { type ProjectConfig, templates, type TemplateType } from "./Domain.ts";
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
    Argument.withSchema(ProjectNameSchema),
    Argument.withDescription("The folder to create the efffrida application in"),
    Argument.mapEffect((projectName) => Effect.map(Path.Path, (path) => path.resolve(projectName)))
);

const templateFlag = Flag.ChoiceWithValue(
    "template",
    templates.map((t) => [t, t] as const)
).pipe(
    Flag.withDescription("The project template to use"),
    Flag.withFallbackPrompt(
        Prompt.Select<TemplateType>({
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
            ],
        })
    )
);

const withOxcToolsFlag = Flag.ChoiceWithValue("oxc-tools", [["yes", true] as const, ["no", false] as const]).pipe(
    Flag.withDescription("Add oxc-tools for formatting and linting"),
    Flag.withFallbackPrompt(
        Prompt.Toggle({
            message: "Add oxc-tools for formatting and linting?",
            active: "yes",
            inactive: "no",
            initial: true,
        })
    )
);

const withNodeVitestFlag = Flag.ChoiceWithValue("node-vitest", [["yes", true] as const, ["no", false] as const]).pipe(
    Flag.withDescription("Add vitest for Node.js unit testing"),
    Flag.withFallbackPrompt(
        Prompt.Toggle({
            message: "Add vitest for Node.js unit testing?",
            active: "yes",
            inactive: "no",
            initial: true,
        })
    )
);

const withFridaVitestFlag = Flag.ChoiceWithValue("frida-vitest", [["yes", true] as const, ["no", false] as const]).pipe(
    Flag.withDescription("Add @efffrida/vitest-pool for running tests inside Frida"),
    Flag.withFallbackPrompt(
        Prompt.Toggle({
            message: "Add @efffrida/vitest-pool for running tests inside Frida?",
            active: "yes",
            inactive: "no",
            initial: true,
        })
    )
);

const withWorkflowsFlag = Flag.ChoiceWithValue("workflows", [["yes", true] as const, ["no", false] as const]).pipe(
    Flag.withDescription("Initialize project with GitHub Actions CI workflows"),
    Flag.withFallbackPrompt(
        Prompt.Toggle({
            message: "Initialize project with GitHub Actions CI workflows?",
            active: "yes",
            inactive: "no",
            initial: true,
        })
    )
);

const withNixFlakeFlag = Flag.ChoiceWithValue("flake", [["yes", true] as const, ["no", false] as const]).pipe(
    Flag.withDescription("Initialize project with a Nix flake"),
    Flag.withFallbackPrompt(
        Prompt.Toggle({
            message: "Initialize project with a Nix flake?",
            active: "yes",
            inactive: "no",
            initial: true,
        })
    )
);

const withChangesetsFlag = Flag.ChoiceWithValue("changesets", [["yes", true] as const, ["no", false] as const]).pipe(
    Flag.withDescription("Initialize project with Changesets for versioning"),
    Flag.withFallbackPrompt(
        Prompt.Toggle({
            message: "Initialize project with Changesets for versioning?",
            active: "yes",
            inactive: "no",
            initial: true,
        })
    )
);

// =============================================================================
// Command
// =============================================================================

const command = Command.make("create-efffrida-app", {
    projectName: projectName,
    template: templateFlag,
    withNodeTests: withNodeVitestFlag,
    withFridaTests: withFridaVitestFlag,
    withOxcTools: withOxcToolsFlag,
    withNixFlake: withNixFlakeFlag,
    withChangesets: withChangesetsFlag,
    withWorkflows: withWorkflowsFlag,
}).pipe(
    Command.withDescription("Create an efffrida application from a template repository"),
    Command.withHandler(handleCommand)
);

export const cli = Command.run(command, { version: __VERSION__ });

// =============================================================================
// Handler
// =============================================================================

const PackageJson = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Json), { space: 4 });

function handleCommand(config: ProjectConfig) {
    return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        if (yield* fs.exists(config.projectName)) {
            const info = yield* fs.stat(config.projectName);
            const isEmptyDirectory =
                info.type === "Directory" && (yield* fs.readDirectory(config.projectName)).length === 0;
            if (!isEmptyDirectory) {
                const message = `Refusing to create a project in ${config.projectName} because it already exists and is not an empty directory`;
                return yield* new CliError.UserError({ cause: message, userMessage: message });
            }
        }

        yield* Effect.logInfo(`Creating a new efffrida application in ${config.projectName}`);
        yield* fs.makeDirectory(config.projectName, { recursive: true });

        yield* Effect.logInfo(`Initializing project with template: ${config.template}`);
        yield* GitHub.use((github) => github.downloadTemplate(config));

        const packageJsonPath = path.join(config.projectName, "package.json");
        const packageJson = yield* Effect.flatMap(fs.readFileString(packageJsonPath), Schema.decodeEffect(PackageJson));
        const renamed = yield* Schema.encodeEffect(PackageJson)({
            ...packageJson,
            name: path.basename(config.projectName),
        });
        yield* fs.writeFileString(packageJsonPath, `${renamed}\n`);
    });
}
