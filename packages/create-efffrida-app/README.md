# create-efffrida-app

Scaffolds a new efffrida project from one of the templates in the
[efffrida repository](https://github.com/leonitousconforti/efffrida/tree/main/templates).

### Usage

```sh
npm create efffrida-app
# or
pnpm create efffrida-app
```

Any option that is not passed on the command line is asked for interactively.
The yes/no options also accept a `--no-` prefix, so a fully non-interactive run
looks like:

```sh
pnpm create efffrida-app my-app --template agent-only \
    --oxc-tools --node-vitest --frida-vitest --workflows --flake --no-changesets
```

The `@efffrida/*` dependencies of the new project are pinned to the versions
released together with the template.

### Templates

- `agent-only`: a single Frida agent using `@efffrida/platform` and
  `FridaRuntime.runMain`, tested inside Frida with `@efffrida/vitest-pool`.
- `app-and-agent`: a Node.js host app and a Frida agent that talk over
  `@efffrida/rpc`, with separate tsconfigs for each side.

### Options

| Option           | Description                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `<project-name>` | The folder to create the project in, or `.` to use the current directory (which must be empty)                              |
| `--template`     | The template to use, `agent-only` or `app-and-agent`                                                                        |
| `--oxc-tools`    | Add oxlint and oxfmt for linting and formatting                                                                             |
| `--node-vitest`  | Add vitest for Node.js unit testing                                                                                         |
| `--frida-vitest` | Add `@efffrida/vitest-pool` for running tests inside Frida                                                                  |
| `--workflows`    | Initialize the project with GitHub Actions CI workflows                                                                     |
| `--flake`        | Initialize the project with a Nix flake                                                                                     |
| `--changesets`   | Initialize the project with Changesets                                                                                      |
| `--ref`          | The branch, tag or commit of the efffrida repository to download the template from, defaults to the release of this version |

The yes/no options (`--oxc-tools`, `--node-vitest`, `--frida-vitest`,
`--workflows`, `--flake` and `--changesets`) are currently informational only:
the full template is always scaffolded, whatever the answers.
