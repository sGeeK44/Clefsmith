# The score engine

The application draws its own staves. There is no engraving library: the engine is a
layout that produces data and a painter that draws it, and the two are separate so the
first can be tested without the second.

## The split

| Where                 | What it holds                                            |
| --------------------- | -------------------------------------------------------- |
| `src/domain/notation` | Where a pitch sits on a staff, given a clef.             |
| `src/domain/score`    | The layout: lines, glyph placements, stems, leger lines. |
| `src/components/ui`   | The painter: Skia, the font, the theme colours.          |

The layout emits plain data and knows nothing about React, Skia or a screen —
**checked** by the `inner-layers-are-platform-free` rule of `bun run arch`, a step of
`tools/verify`. That is what makes every engraving rule a unit test instead of a
screenshot.

## Coordinates

Everything is in **staff spaces**, the distance between two staff lines, and `y` grows
**upwards** from the bottom line. The five lines are therefore at 0, 1, 2, 3, 4, and a
note below the staff has a negative `y`. It is SMuFL's own convention, so the font's
metrics drop in without conversion, and a staff drawn twice as large is the same numbers
against a larger space.

The layout also publishes how far the drawing reaches above and below the bottom line,
ink included — a canvas sized by the staff alone clips the clef, which is taller than it.
The painter owns the one thing the layout does not know: a canvas grows downwards.

## Shades

A note is handed to the layout with a **shade** — `ahead`, `current`, `ok`, `late`,
`wrong` — and the layout carries it onto the notehead, its stem and its leger lines.
Which shade a note gets is the screen's call, not the layout's: the layout knows that a
note is drawn one of five ways and nothing about what an answer was worth. The painter
owns the colours, and the ground behind the note shaded `current`.

**Checked by** `src/domain/score/layout.test.ts` for the carrying, and by
`src/components/wording/exercise.test.ts` for the screen's choice of shade.

`src/domain/notation/clef.ts` counts in **half**-spaces instead, because that is the gap
between two neighbouring degrees. The layout halves it once, where the notehead is placed.

## The glyph table

`src/domain/score/bravura.ts` is **generated** and must not be edited: it maps a SMuFL
glyph name to a codepoint, an advance width, how far its ink reaches above and below its
origin, and the two stem anchors. The layout asks for
a name and never sees a codepoint.

Adding a glyph — a flag, a rest, a beam — is three steps and none of them is a layout
change:

1. add the name to `GlyphName` in `src/domain/score/glyph.ts`;
2. add it to the list at the top of `tools/smufl/extract.ts`;
3. re-run the extractor, whose header carries the two `curl` commands and the invocation.

**Not checked by anything**: that a new glyph does not drag a branch into the layout. It
is the design the ticket asked for, held up at review.

## The font

Bravura, under SIL OFL 1.1, in `assets/fonts/` with its licence beside it — the licence
must travel with the font. It is bundled as an asset rather than embedded by the
`expo-font` plugin: Skia loads a typeface from a file itself, and the text roles of
`docs/design-system.md` are a different concern from the glyphs of a staff.

The font's SMuFL metadata and SMuFL's glyph-name table are **not** committed — the
extractor's header says where to fetch them. Together they weigh more than the
application; what is committed is the handful of numbers they yield and the tool that
re-derives them.

## What it does not do yet

No rhythm — no flags, beams, rests or barlines. No accidentals, no key signatures, no
scrolling. The glyph table is the seam they arrive through.
