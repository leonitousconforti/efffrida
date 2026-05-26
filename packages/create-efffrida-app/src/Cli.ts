import { Effect, Path, FileSystem } from "effect";
import { Argument, Command, Flag, Prompt } from "effect/unstable/cli";

import { type ProjectConfig, templates, type TemplateType } from "./Domain.js";
import { GitHub } from "./GitHub.js";
import { ProjectNameSchema } from "./Utils.js";

// =============================================================================
// CLI Specification
// =============================================================================

const projectName = Argument.directory("project-name").pipe(
    Argument.withFallbackPrompt(
        Prompt.text({
            message: "What is your project named?",
            default: "efffrida-app",
        })
    ),
    Argument.withSchema(ProjectNameSchema),
    Argument.withDescription("The folder to create the efffrida application in"),
    Argument.mapEffect((projectName) => Effect.map(Path.Path, (path) => path.resolve(projectName)))
);

const templateFlag = Flag.choice("template", [...templates]).pipe(
    Flag.withAlias("t"),
    Flag.withDescription("The project template to use"),
    Flag.withFallbackPrompt(
        Prompt.select<TemplateType>({
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
                {
                    title: "Monorepo",
                    value: "monorepo",
                    description: "A pnpm monorepo with agent, app, and shared packages",
                },
            ],
        })
    )
);

// const withNodeVitestFlag = Flag.boolean("node-vitest").pipe(
//     Flag.withDescription("Add vitest for Node.js unit testing"),
//     Flag.withFallbackPrompt(
//         Prompt.toggle({
//             message: "Add vitest for Node.js unit testing?",
//             initial: true,
//         })
//     )
// );

// const withFridaVitestFlag = Flag.boolean("frida-vitest").pipe(
//     Flag.withDescription("Add @efffrida/vitest-pool for running tests inside Frida"),
//     Flag.withFallbackPrompt(
//         Prompt.toggle({
//             message: "Add @efffrida/vitest-pool for running tests inside Frida?",
//             initial: true,
//         })
//     )
// );

// const withWorkflowsFlag = Flag.boolean("workflows").pipe(
//     Flag.withDescription("Initialize project with GitHub Actions CI workflows"),
//     Flag.withFallbackPrompt(
//         Prompt.toggle({
//             message: "Initialize project with GitHub Actions CI workflows?",
//             initial: true,
//         })
//     )
// );

// const withNixFlakeFlag = Flag.boolean("flake").pipe(
//     Flag.withDescription("Initialize project with a Nix flake"),
//     Flag.withFallbackPrompt(
//         Prompt.toggle({
//             message: "Initialize project with a Nix flake?",
//             initial: true,
//         })
//     )
// );

// const withChangesetsFlag = Flag.boolean("changesets").pipe(
//     Flag.withDescription("Initialize project with Changesets for versioning"),
//     Flag.withFallbackPrompt(
//         Prompt.toggle({
//             message: "Initialize project with Changesets for versioning?",
//             initial: true,
//         })
//     )
// );

// =============================================================================
// Command
// =============================================================================

export interface RawOptions {
    readonly projectName: string;
    readonly template: TemplateType;
}

const command = Command.make("create-efffrida-app", {
    template: templateFlag,
    projectName: projectName,
}).pipe(
    Command.withDescription("Create an efffrida application from a template repository"),
    Command.withHandler(handleCommand)
);

export const cli = Command.run(command, { version: "v0.0.1" });

// =============================================================================
// Handler
// =============================================================================

function handleCommand(raw: RawOptions) {
    return scaffoldProject({
        projectName: raw.projectName,
        template: raw.template,
        withNodeTests: true,
        withFridaTests: true,
        withWorkflows: true,
        withNixFlake: true,
        withChangesets: true,
    });
}

// =============================================================================
// Scaffolding
// =============================================================================

function scaffoldProject(config: ProjectConfig) {
    return Effect.gen(function* () {
        // const path = yield* Path.Path;
        const fs = yield* FileSystem.FileSystem;

        yield* Effect.logInfo(`Creating a new efffrida application in ${projectName}`);
        yield* fs.makeDirectory(config.projectName, { recursive: true });

        yield* Effect.logInfo(`Initializing project with template: ${config.template}`);
        yield* GitHub.use((github) => github.downloadTemplate(config));
    });
}
