# Design system

## Tokens

A token is named by the role it plays — `ink`, `muted`, `line`, `accent` — never by the
colour it happens to be. A screen that knows `#1f1c17` cannot follow the system setting;
a screen that knows `ink` follows it for free.

Eleven colour roles, a spacing scale, a radius scale and a type scale, declared in
`src/components/theme/tokens.ts`. Spacing, radii and type are shared by both themes: a
rhythm does not change with the light.

The mockup supplies the light palette only. The dark one is derived from it — warm hue
kept, lightness ladder inverted role by role, status colours moved up in lightness at
constant hue and chroma. The mockup writes its status colours in `oklch()`, which older
Android versions do not parse, so each is converted once, committed as hex, and keeps its
`oklch` in the comment beside it. Without that, the dark variant cannot be re-derived.

**Checked** by `bun test`, a step of `tools/verify`: the two themes must declare the same
roles, text roles must reach 4.5:1 against their own ground and status roles 3:1. The
contrast is computed, not copied — a number pasted from a contrast checker stays behind
when a token moves.

## Themes

`react-native-unistyles` is configured once in `src/components/theme/unistyles.ts`, with
`adaptiveThemes` on. The application follows the system setting and offers no theme picker:
the choice already exists on the device, and a second one that disagrees with it is a bug
waiting to be reported.

Unistyles rewrites the components it styles at compile time, which is what `babel.config.js`
is for. Without that plugin a themed component renders with no style at all.

## Components

Seven, in `src/components/ui/`:

| Component | Holds                                                     |
| --------- | --------------------------------------------------------- |
| `Text`    | The only place a font family or a type size is named.     |
| `Button`  | Two weights of emphasis, `primary` and `quiet`.           |
| `Card`    | The only component that knows what "raised" looks like.   |
| `Screen`  | The page: ground, safe-area insets, gutter.               |
| `Choice`  | Which of several options is the current one.              |
| `Flash`   | A message that says something and then takes itself away. |
| `Toggle`  | One thing that is either on or off, and its label.        |

`Choice` is not a `Button`: a button asks to be acted on, a choice shows a state. The
selected option carries the accent, and nothing in it is primary.

`Flash` is not a dialog: nothing has to be dismissed and nothing is blocked while it is
up. A message that needs an answer is a screen, not a flash.

`Toggle` lets the platform draw the switch. It is a control the learner already knows how
to read, and a hand-drawn one loses the gesture and the accessibility that come with it —
only its colours are ours.

The next component arrives with the screen that needs it, not before. A design system
grown ahead of its screens is a catalogue of guesses — `Choice` arrived with Réglages,
`Flash` with the desk and `Toggle` with the parcours, which is the rule working rather
than an exception to it.

**Not checked by anything**: that a screen uses a token rather than a literal colour. It is
a convention, held up at review.

## Typography

Outfit, weights 300 to 700, embedded into the native projects by the `expo-font` config
plugin listed in `app.json`. Embedded rather than loaded at runtime: `useFonts` would make
the typography an async state every screen waits on. The cost is that a new weight needs a
prebuild.

`@expo-google-fonts/outfit` is imported by no file — `app.json` names its paths — which is
why it is declared in `knip.jsonc`.

## Looking at it

Nothing any more: the gallery route is gone. `Staff`, `Card` and `Text` have the desk,
`Choice` has Réglages, and a role is looked at on the screen that uses it. Switch the
system setting and every role on the page moves at once.

**Not checked by anything**: that the palette moves with the system setting. It needs a
device, and the device suite only runs on the release pull request.
