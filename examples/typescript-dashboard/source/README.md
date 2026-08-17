# TypeScript-family logic

Run `npm install` and `npm run build`. This template uses AssemblyScript, a
strict TypeScript-family language that compiles directly to WebAssembly without
WASI. The output is written to the example package root as `logic.wasm`.

The regular Extism JavaScript/TypeScript PDK currently requires WASI, so it is
not enabled by SlideSpace's no-WASI community runtime. Do not use `fetch` here;
declare HTTP data sources in `manifest.json` and consume their sanitized results.
