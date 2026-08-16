# SlideSpace Widget SDK

Build small, safe widgets for the SlideSpace managed desktop. Widgets are declarative packages: they contain JSON and optional raster assets, never native code or JavaScript.

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
- Bindings contain host-provided values; a widget cannot execute arbitrary code.
- Typed settings support boolean, number, text, choice, color, and secret fields.
- Network access is opt-in, HTTPS-only, and restricted to declared hosts.
- Packages may include PNG, JPEG, and WebP assets under `assets/`.

See [`examples/hello-clock`](examples/hello-clock) for a working package. The example is intentionally an SDK sample, not a catalog widget; SlideSpace already includes its own full Clock widget.

## Publishing

Create a verified A Terrible Day Software account with SlideSpace access, then open [Widget publishing](https://aterrible.day/widgets/submit). Each version goes through automated validation and manual review. Community widgets must be free and may not contain advertising or paid feature unlocks.

Full documentation is available at [aterrible.day/widgets/docs](https://aterrible.day/widgets/docs).

