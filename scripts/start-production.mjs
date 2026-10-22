globalThis.process.env.NODE_ENV ??= "production";
globalThis.process.env.PORT ??= "8080";

await import("../dist/index.js");
