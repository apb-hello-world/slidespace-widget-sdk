# Data sources and brokered network access

Widgets can declare multiple `http`, `system.clock`, `system.performance`, `system.storage`, and `system.media` sources. HTTP sources support HTTPS GET/HEAD and bounded JSON, XML/RSS/Atom, or text responses. Refresh intervals are at least 60 seconds; manual refresh has its own short rate limit.

Public hosts require `network.https`. Localhost, private, link-local, and reserved destinations additionally require `network.local` and explicit per-widget, per-origin approval. SlideSpace validates every redirect and resolved address, sends no cookies or ambient credentials, and applies time, redirect, encoded-size, decoded-image, cache, backoff, and offline-last-good-data limits.

Use a URL setting with `approvesNetworkOrigin: true` for a user-selected endpoint. A changed origin pauses requests until the user approves it. JSONPath and XPath support intentionally bounded subsets; XML external entities are disabled.

## Bounded feeds and collections

For XML/RSS/Atom responses, `itemsSelector` produces an `items` collection. Use `maximumItems` for a fixed limit or `maximumItemsSetting` to let a bounded number setting control the limit. SlideSpace accepts between 1 and 100 items and applies the limit before the collection reaches the renderer.

RSS and Atom entries expose their element names by local name, including feeds with a default XML namespace. Common publication fields are also normalized to `publishedDate`, and common description fields are normalized to `summary`.

## Storage sources

`system.storage` exposes the selected volume through the original top-level fields and exposes a bounded `items` collection for repeating layouts. Configure it with:

- `volumeSetting`: a volume setting used when one drive is shown.
- `showAllSetting`: a Boolean setting that chooses between the selected drive and all ready local volumes.
- `volumesSetting`: a multi-volume setting that shows the selected drives. An empty selection means all available drives.

Each item contains `name`, `label`, `format`, byte counts, free/used ratios, and formatted free/capacity text. The drive-capacity example uses the multi-drive form.

## Settings in bindings

Non-secret instance settings are available to the native renderer under `settings.<key>`. This supports user-defined headings, visibility conditions, style choices, and other presentation options. Secret settings are never added to this object.

Remote images are downloaded by the same broker and decoded only after type, dimension, and size checks. Wasm modules never fetch directly.
