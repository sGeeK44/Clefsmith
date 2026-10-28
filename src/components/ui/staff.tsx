import { Canvas, Text as Glyph, Line, useFont, vec } from '@shopify/react-native-skia';
import { useUnistyles } from 'react-native-unistyles';
import type { Clef } from '@/domain/notation/clef';
import { GLYPHS } from '@/domain/score/bravura';
import { ENGRAVING } from '@/domain/score/engraving';
import { layoutStaff, type Note } from '@/domain/score/layout';

const BRAVURA = require('../../../assets/fonts/Bravura.otf');

/**
 * A SMuFL em is four staff spaces, so a font asked for `4 * space` draws a staff of
 * exactly that space. Everything else on the canvas is in spaces too, which is why
 * the whole component holds one number.
 */
const EM_IN_SPACES = 4;

/**
 * Room left above and below the staff for what sticks out of it — a clef reaches
 * further than any note, and leger lines reach further still.
 */
const MARGIN = 2.5;

export function Staff({
  clef,
  notes,
  space = 12,
}: {
  readonly clef: Clef;
  readonly notes: readonly Note[];
  readonly space?: number;
}) {
  const { theme } = useUnistyles();
  const font = useFont(BRAVURA, space * EM_IN_SPACES);
  const layout = layoutStaff(clef, notes, ENGRAVING, GLYPHS);

  const ys = [
    ...layout.lines.flatMap((line) => [line.from.y, line.to.y]),
    ...layout.glyphs.map((glyph) => glyph.y),
  ];
  const top = Math.max(...ys) + MARGIN;
  const height = (top - Math.min(...ys) + MARGIN) * space;

  /** Staff coordinates grow upwards; a canvas grows downwards. */
  const at = (x: number, y: number) => vec(x * space, (top - y) * space);

  if (font === null) {
    return null;
  }

  return (
    <Canvas style={{ width: layout.width * space, height }}>
      {layout.lines.map((line) => (
        <Line
          key={`${line.from.x},${line.from.y}-${line.to.x},${line.to.y}`}
          color={line.current ? theme.colors.accent : theme.colors.ink}
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
            color={glyph.current ? theme.colors.accent : theme.colors.ink}
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
