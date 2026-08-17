# Declarative layout and styling

Schema 3 uses renderer `declarative-v3`. Layout trees support `stack`, `grid`, `overlay`, `repeat`, `conditional`, `text`, `image`, `progress`, `chart`, `button`, and `spacer` nodes.

Bindings read values produced by data sources or Wasm logic. Repeating nodes bind to a bounded collection and render an item template. Conditional nodes compare a binding without executing expressions. Buttons name a typed action declared in `actions`; arbitrary code and shell commands are not valid actions.

Style properties include alignment, spacing, typography, colors, borders, opacity, and corner radius. SlideSpace renders these controls natively and may throttle transitions when a widget is obscured, inactive, or under resource pressure.
