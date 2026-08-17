# Data sources and brokered network access

Widgets can declare multiple `http`, `system.clock`, `system.performance`, `system.storage`, and `system.media` sources. HTTP sources support HTTPS GET/HEAD and bounded JSON, XML/RSS/Atom, or text responses. Refresh intervals are at least 60 seconds; manual refresh has its own short rate limit.

Public hosts require `network.https`. Localhost, private, link-local, and reserved destinations additionally require `network.local` and explicit per-widget, per-origin approval. SlideSpace validates every redirect and resolved address, sends no cookies or ambient credentials, and applies time, redirect, encoded-size, decoded-image, cache, backoff, and offline-last-good-data limits.

Use a URL setting with `approvesNetworkOrigin: true` for a user-selected endpoint. A changed origin pauses requests until the user approves it. JSONPath and XPath support intentionally bounded subsets; XML external entities are disabled.

Remote images are downloaded by the same broker and decoded only after type, dimension, and size checks. Wasm modules never fetch directly.
