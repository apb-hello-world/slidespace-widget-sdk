# Declarative layout and styling

Schema 3 uses renderer `declarative-v3`. Layout trees support `stack`, `grid`, `overlay`, `repeat`, `conditional`, `text`, `image`, `progress`, `chart`, `button`, and `spacer` nodes.

Bindings read values produced by data sources or Wasm logic. Repeating nodes bind to a bounded collection and render an item template. Set `scrollable` on a repeater to let interactive widgets reveal additional bounded items with the mouse wheel; click-through widgets continue passing wheel input to the application underneath. Conditional nodes compare a binding without executing expressions. Buttons name a typed action declared in `actions`; arbitrary code and shell commands are not valid actions.

Style properties include alignment, spacing, typography, colors, borders, opacity, and corner radius. Text styles support fixed typography as well as `fontFamilyBinding` and `fontSizeBinding` values from non-secret widget settings or data. Colors use CSS-style `#RRGGBB` or `#RRGGBBAA` values, with the final two digits representing opacity. They may similarly use `colorBinding`, `backgroundColorBinding`, and `borderColorBinding`, which makes user-selectable native themes possible without custom code. SlideSpace renders these controls natively and may throttle transitions when a widget is obscured, inactive, or under resource pressure.
