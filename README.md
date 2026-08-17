# SlideSpace Widget SDK

Build small, safe widgets for the SlideSpace managed desktop. The SDK provides the manifest schema, validation, packaging tools, examples, and publishing guidance.

SlideSpace widgets are not miniature web pages. The current runtime does not execute HTML, JavaScript, native code, or arbitrary API requests. SlideSpace renders a reviewed JSON layout and supplies approved host data, keeping widgets lightweight and permission-scoped.

## Quick start

```powershell
npm install
npm run build
node dist/cli.js init my-widget
node dist/cli.js validate my-widget
node dist/cli.js pack my-widget
```

Enable **Developer mode** in SlideSpace's Widget extensions screen to install an unsigned local `.sswidget` while developing. Published catalog releases are reviewed and signed by A Terrible Day Software.

## Package model

- `manifest.json` uses schema 2 and the `declarative-v2` renderer.
- Layout primitives are `stack`, `text`, `progress`, and `spacer`.
- Bindings contain host-provided values such as `primary`, `secondary`, and `clock`.
- The available data sources are `static` and `system.clock`.
- Packages may include PNG, JPEG, and WebP assets under `assets/`.
- Network permission and host declarations are reserved for future host-provided data sources. The current runtime does not expose `fetch` or direct API access.

## Examples

- [`hello-clock`](examples/hello-clock) formats live host-provided clock data.
- [`layout-showcase`](examples/layout-showcase) demonstrates nested horizontal and vertical stacks, bound and literal text, spacing, a progress indicator, transparency, and a more involved card layout.

These are SDK samples rather than catalog widgets. SlideSpace already includes its own Clock, System Performance, and Now Playing widgets.

Validate and package either example with the same CLI used for your own widget:

```powershell
node dist/cli.js validate examples/layout-showcase
node dist/cli.js pack examples/layout-showcase
```

## Current runtime boundary

| Capability | Available now |
| --- | --- |
| JSON layouts with stacks, text, progress, and spacers | Yes |
| Static values and host-provided clock data | Yes |
| Transparent widget backgrounds | Yes |
| Raster files packaged under `assets/` | Yes |
| HTML or CSS rendering | No |
| JavaScript execution | No |
| Direct HTTP requests or arbitrary API calls | No |

As SlideSpace adds reviewed host APIs, new SDK versions will document the corresponding data sources, bindings, permissions, and examples.

## Publishing

Create a verified A Terrible Day Software account with SlideSpace access, then open [Widget publishing](https://aterrible.day/widgets/submit). Each version goes through automated validation and manual review. Community widgets must be free and may not contain advertising or paid feature unlocks.

Full documentation is available at [aterrible.day/docs/slidespace/widgets](https://aterrible.day/docs/slidespace/widgets).
