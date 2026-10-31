import { Canvas, Text as Glyph, Line, RoundedRect, useFont, vec } from '@shopify/react-native-skia';
import { useUnistyles } from 'react-native-unistyles';
import type { Colors } from '@/components/theme/tokens';
import type { Clef } from '@/domain/notation/clef';
import { GLYPHS } from '@/domain/score/bravura';
import { ENGRAVING } from '@/domain/score/engraving';
import { type Barring, layoutStaff, type Note, type Shade } from '@/domain/score/layout';

const BRAVURA = require('../../../assets/fonts/Bravura.otf');

/**
 * A SMuFL em is four staff spaces, so a font asked for `4 * space` draws a staff of
 * exactly that space. Everything else on the canvas is in spaces too, which is why
 * the whole component holds one number.
 */
const EM_IN_SPACES = 4;

/**
 * How wide the ground behind the note being read is, in staff spaces.
 *
 * It is centred on the notehead, which is drawn from its left edge — the same
 * half-head the leger lines are placed by.
 */
const HIGHLIGHT = 2.4;

/**
 * What each shade is drawn in.
 *
 * `ahead` is the ink everything else is measured against — the staff lines are
 * shaded that way too, which is why it is the one that is not a verdict.
 */
function colourOf(shade: Shade, colors: Colors): string {
  const palette: Record<Shade, string> = {
    ahead: colors.ink,
    current: colors.accent,
    ok: colors.ok,
    late: colors.late,
    wrong: colors.bad,
  };

  return palette[shade];
}

export function Staff({
  barring,
  clef,
  notes,
  space = 12,
}: {
  readonly barring?: Barring;
  readonly clef: Clef;
  readonly notes: readonly Note[];
  readonly space?: number;
}) {
  const { theme } = useUnistyles();
  const font = useFont(BRAVURA, space * EM_IN_SPACES);
  const layout = layoutStaff(clef, notes, ENGRAVING, GLYPHS, barring);

  /** Staff coordinates grow upwards; a canvas grows downwards. */
  const at = (x: number, y: number) => vec(x * space, (layout.top - y) * space);

  if (font === null) {
    return null;
  }

  return (
    <Canvas style={{ width: layout.width * space, height: (layout.top - layout.bottom) * space }}>
      {layout.glyphs
        .filter((glyph) => glyph.shade === 'current' && glyph.glyph === 'noteheadBlack')
        .map((glyph) => (
          <RoundedRect
            color={theme.colors.soft}
            height={(layout.top - layout.bottom) * space}
            key={`highlight-${glyph.x}`}
            r={space}
            width={HIGHLIGHT * space}
            x={(glyph.x + ENGRAVING.noteheadWidth / 2 - HIGHLIGHT / 2) * space}
            y={0}
          />
        ))}
      {layout.lines.map((line) => (
        <Line
          key={`${line.from.x},${line.from.y}-${line.to.x},${line.to.y}`}
          color={colourOf(line.shade, theme.colors)}
          p1={at(line.from.x, line.from.y)}
          p2={at(line.to.x, line.to.y)}
          strokeWidth={line.thickness * space}
        />
      ))}
      {layout.glyphs.map((glyph) => {
        const origin = at(glyph.x, glyph.y);

        return (
          <Glyph
            key={`${glyph.glyph}-${glyph.x}-${glyph.y}`}
            color={colourOf(glyph.shade, theme.colors)}
            font={font}
            text={String.fromCodePoint(Number.parseInt(GLYPHS[glyph.glyph].codepoint.slice(2), 16))}
            x={origin.x}
            y={origin.y}
          />
        );
      })}
    </Canvas>
  );
}
