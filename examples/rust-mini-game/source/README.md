# Rust logic

Install `wasm32-unknown-unknown`, run `cargo build --release`, and copy
`target/wasm32-unknown-unknown/release/slidespace_rust_mini_game.wasm` to the
example package root as `logic.wasm`.

The module receives only the bounded Widget Runtime API input and returns state,
view-model values, and typed command requests. It has no WASI imports.
