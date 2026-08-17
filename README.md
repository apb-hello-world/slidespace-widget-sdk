# SlideSpace Widget SDK

Build lightweight widgets for the SlideSpace managed desktop. This repository is the canonical source for Widget API contracts, generated schemas, package tooling, runtime fixtures, documentation, and reviewed examples.

Widget API v3 has two authoring levels:

- **Declarative widgets** combine native layout primitives, brokered data sources, typed settings, and typed actions.
- **Advanced widgets** add sandboxed WebAssembly logic while keeping SlideSpace's native renderer.

Community widgets never run HTML, WebView2 content, native DLLs, or unrestricted scripts. Network and Windows features are supplied only by the permission-scoped SlideSpace host.

## Quick start

```powershell
npm install
npm run check
node dist/cli.js init my-widget declarative
node dist/cli.js validate my-widget
node dist/cli.js simulate my-widget
node dist/cli.js inspect my-widget
node dist/cli.js pack my-widget
```

Use `rust` or `typescript` instead of `declarative` to scaffold a logic-enabled package. Enable **Developer mode** in SlideSpace's Widget extensions screen to install an unsigned local `.sswidget` while developing. Published releases are reviewed and signed.

## Included contracts

- Zod schemas and generated JSON Schemas for v2/v3 manifests and the v3 runtime protocol.
- Capability normalization through `createPermissionSnapshot`.
- CLI commands for scaffolding, validation, simulation, testing, inspection, packaging, and publishing.
- Versioned documentation under [`docs/v3`](docs/v3/README.md).
- Conformance examples for RSS/Atom, storage, media, authenticated HTTP, Rust state, and TypeScript multi-source logic.

Widget API v1/v2 packages remain compatible. New widget projects should use schema 3 and renderer `declarative-v3`.

## Examples

| Example | Level | Main capabilities |
| --- | --- | --- |
| [`rss-reader`](examples/rss-reader) | Declarative | User-approved feed URL, XML/RSS, repeating layout |
| [`drive-capacity`](examples/drive-capacity) | Declarative | Storage data, progress and repeaters |
| [`media-controls`](examples/media-controls) | Declarative | Media metadata, artwork, typed controls |
| [`authenticated-api`](examples/authenticated-api) | Declarative | Protected secret header and HTTPS data |
| [`rust-mini-game`](examples/rust-mini-game) | Wasm | Events, state, continuous animation |
| [`typescript-dashboard`](examples/typescript-dashboard) | Wasm | Multiple data sources and derived view model |

The built-in Clock, System Performance, and Now Playing widgets continue to ship with SlideSpace and do not use the community catalog channel.

## Security boundary

SlideSpace brokers all HTTP, image, system-data, link, storage, and media operations. Optional Wasm logic receives bounded JSON and can only return validated state, values, and typed action requests. It has no ambient network, filesystem, registry, process, clipboard, environment, browser-session, or Windows credential access.

See [Security and permissions](docs/v3/security-and-permissions.md) and [WebAssembly logic](docs/v3/wasm.md) for the complete contract.

## Publishing

Create a verified A Terrible Day Software account, then open [Widget publishing](https://aterrible.day/widgets/submit). Each release goes through automated validation and staff review. Wasm packages require public source metadata pinned to a commit.

Branded documentation is available at [aterrible.day/docs/slidespace/widgets](https://aterrible.day/docs/slidespace/widgets) and is rendered from this repository's versioned documentation.
