import * as Schema from "effect/Schema";

import { builtinModules } from "node:module";

export const ProjectNameSchema = Schema.String.check(
    Schema.isMinLength(1, {
        message: "Project name must be a non-empty string",
    }),
    Schema.isMaxLength(214, {
        message: "Project name must not contain more than 214 characters",
    }),
    Schema.isPattern(/^[a-z0-9._-]+$/, {
        message: "Project name must only contain lowercase letters, numbers, dots, underscores, or hyphens",
    }),
    Schema.isPattern(/^[^.].*$/, {
        message: "Project name must not start with a period",
    }),
    Schema.isPattern(/^[^_].*$/, {
        message: "Project name must not start with an underscore",
    }),
    Schema.makeFilter((name) => {
        if (builtinModules.includes(name)) {
            return "Project name must not be a Node.js built-in module name";
        }
    })
);
