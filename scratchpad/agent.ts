send("Hello, World!");
setTimeout(() => send("Goodbye, World!"), 600_000);
recv(() => {});
