# Design system

## Tokens

A token is named by the role it plays — `ink`, `muted`, `line`, `accent` — never by the
colour it happens to be. A screen that knows `#1f1c17` cannot follow the system setting;
a screen that knows `ink` follows it for free.

Eleven colour roles, a spacing scale, a radius scale and a type scale, declared in
`src/components/theme/tokens.ts`. Spacing, radii and type are shared by both themes: a
rhythm does not change with the light.

The radius scale is the mockup's own four corners plus the pill: `s` is a bar or a dot,
`m` a pad or a segment, `l` a button, `xl` a card. They are not a geometric progression —
the step from a segment to a card is what the eye reads as "this is a surface", and a
ladder that happened to be regular would move it. The segmented `Choice` takes its inner
corner as `m` less its lip, which lands on the mockup's own 11 without anyone writing 11
down twice.

Both palettes are the mockup's own, read off it as-is. The mockup writes its status
colours in `oklch()`, which older Android versions do not parse, so each is converted once,
committed as hex, and keeps its `oklch` in the comment beside it — a hex value nobody can
re-derive is a value nobody can change.

`canvas` is darker than `bg` in **both** themes. The staff sits in a well on either
ground, never on a raised card, which is what keeps the stave lines reading as paper.

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

Eleven, in `src/components/ui/`:

| Component | Holds                                                     |
| --------- | --------------------------------------------------------- |
| `Text`    | The only place a font family or a type size is named.     |
| `Button`  | Two weights of emphasis, `primary` and `quiet`.           |
| `Card`    | The only component that knows what "raised" looks like.   |
| `Screen`  | The page: ground, safe-area insets, gutter.               |
| `Choice`  | Which of several options is the current one.              |
| `Flash`   | A message that says something and then takes itself away. |
| `Toggle`  | One thing that is either on or off, and its label.        |
| `Beat`    | Which of the four beats of a measure is passing.          |
| `Chip`    | One fact about what is about to be played, on a fill.     |

A primary `Button` is **ink**, not accent. Accent is the colour that points at
something — an overline, a study that has just opened, the note being read — and a screen
whose only button already wears it has nothing left to point with. Ink is also the
strongest fill the palette has, which is what a single primary action wants. The two
heights the mockup draws, 56 and 50, live in `src/components/ui/button.tsx` rather than in the spacing
scale: a `BUTTON` token would be a size one component uses and every other one could
reach for.

**Checked** by `bun test`: `bg` on `ink` must reach 4.5:1 in both themes, the same bar the
text roles are held to. Nothing checks the heights.

`Choice` is not a `Button`: a button asks to be acted on, a choice shows a state. It is
drawn as one track with the current option raised out of it, in equal shares — separate
pills say "press one of these", a track says "it is set to this one", and only the second
is true of a choice.

`Flash` is not a dialog: nothing has to be dismissed and nothing is blocked while it is
up. A message that needs an answer is a screen, not a flash.

`Toggle` lets the platform draw the switch. It is a control the learner already knows how
to read, and a hand-drawn one loses the gesture and the accessibility that come with it —
only its colours are ours.

The next component arrives with the screen that needs it, not before. A design system
grown ahead of its screens is a catalogue of guesses — `Choice` arrived with Réglages,
`Flash` with the desk, `Toggle` with the parcours and `ProgressBar` with the exercise,
which is the rule working rather than an exception to it.

`Beat` arrived with the rhythmic reading and holds no count of its own either: which beat
is passing is the session's business.

`ProgressBar` takes a `tone` from the same vocabulary `Text` does, so a bar and the figure
beside it are given one colour and cannot drift apart — a red number on a blue bar says
two different things about the same note.

`ProgressBar` holds no number of its own. What the share means — notes read, files sent —
is the screen's business, and a bar that knew would be a bar per screen. It has two
weights: the regular one measures the screen, the thin one measures the line of a list it
sits under — at the regular weight a bar under a list line reads as a second element
rather than as a measure of the line above it.

`Chip` arrived with the parcours, where three of them sit side by side under a study. On
the page's own ground they read as one sentence broken by spaces; the fill is what makes
them count as three. Its tone is the text's, never the fill's: a verdict said on a
coloured ground would outshout the note it is a verdict on.

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
