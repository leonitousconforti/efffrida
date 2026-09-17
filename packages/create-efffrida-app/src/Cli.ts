import { Effect, Path, FileSystem } from "effect";
import { Argument, Command, Flag, Prompt } from "effect/unstable/cli";

import { type ProjectConfig, templates, type TemplateType } from "./Domain.ts";
import { GitHub } from "./GitHub.ts";
import { ProjectNameSchema } from "./Utils.ts";

// =============================================================================
// CLI Specification
// =============================================================================

const projectName = Argument.Directory("project-name").pipe(
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

const templateFlag = Flag.Choice("template", [...templates]).pipe(
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

export const cli = Command.run(command, { version: "v0.0.1" });

// =============================================================================
// Handler
// =============================================================================

function handleCommand(config: ProjectConfig) {
    return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        yield* Effect.logInfo(`Creating a new efffrida application in ${config.projectName}`);
        yield* fs.makeDirectory(config.projectName, { recursive: true });

        yield* Effect.logInfo(`Initializing project with template: ${config.template}`);
        yield* GitHub.use((github) => github.downloadTemplate(config));
    });
}
