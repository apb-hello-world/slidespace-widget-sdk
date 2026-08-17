# Drive capacity

This declarative Widget API v3 sample reads storage information through the
`system.storage.read` broker. It can display every available local drive or a
user-selected group of drives without direct filesystem access. An empty
`volumes` setting means all available drives, including drives connected after
the widget was configured. Card, border, text, and usage-bar colors are native
settings rather than executable widget code.
