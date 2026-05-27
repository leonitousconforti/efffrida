import * as Fs from "node:fs";

import * as Glob from "glob";

const dirs = [".", ...Glob.sync("packages/*/"), ...Glob.sync("templates/*/")];
dirs.forEach((pkg) => {
    const files = [".tsbuildinfo", "build", "dist", "temp", "coverage"];

    files.forEach((file) => {
        Fs.rmSync(`${pkg}/${file}`, { recursive: true, force: true }, () => {});
    });
});
