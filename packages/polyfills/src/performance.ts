// Neither of Frida's script runtimes exposes `performance`. Vitest measures
// run and collect durations with `performance.now()`, and those values are only
// ever subtracted from one another, so a `Date`-based origin is sufficient.
if (!("performance" in globalThis)) {
    const timeOrigin = Date.now();
    (globalThis as any).performance = {
        timeOrigin,
        now: (): number => Date.now() - timeOrigin,
    };
}
