# Sandboxed WebAssembly logic

A logic-enabled package contains `logic.wasm` and declares runtime API `3.0`. Community packages also provide a public source repository, pinned commit, license, and build instructions.

Supported exports are `initialize`, `handle_event`, and `migrate_state`. SlideSpace supplies bounded JSON containing non-secret settings, sanitized data-source results, local state, display size, and the triggering event. Output is limited to validated state updates, view-model values, and typed action requests.

The `migrate_state` export receives a `migrate_state` event with `fromVersion` and `toVersion`. Return the migrated state without destructive external effects. If migration fails, SlideSpace retains the previous reviewed package and its original state.

Rust targets `wasm32-unknown-unknown`. The TypeScript-family template uses AssemblyScript because the regular Extism JavaScript/TypeScript PDK currently requires WASI; SlideSpace does not enable WASI for community widgets. Both launch templates therefore produce modules with no ambient OS access.

Wasm executes out of process with direct HTTP and WASI disabled. Modules receive no sockets, filesystem, registry, process, clipboard, environment, or arbitrary Windows imports. Limits include a 10 MB artifact, 64 MB linear memory, 1 MB persistent state, 256 KB output, and CPU/fuel plus wall-clock budgets. Slow modules are throttled and repeatedly violating modules are paused.

`animation.continuous` is visible at install time. Ticks run only while a widget is visible and active, and can be reduced from 60 to 30 or 15 FPS under load. Upgrade migration failure keeps the previous approved package and state.
