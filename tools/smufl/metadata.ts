/**
 * Reads the few numbers a staff needs out of a SMuFL font's metadata.
 *
 * A SMuFL metadata file is over a megabyte of glyphs this application will never
 * draw, so it is not committed. What is committed is the handful of values it
 * yields, and this reader, so that the handful can be re-derived instead of trusted.
 */
import type { Glyph } from '@/domain/score/glyph';

export interface FontMetadata {
  readonly glyphAdvanceWidths: Record<string, number>;
  readonly glyphsWithAnchors: Record<string, Record<string, readonly number[]>>;
}

/** The names-to-codepoints table SMuFL publishes separately from any font. */
export type GlyphNames = Record<string, { readonly codepoint: string }>;

export function glyphOf(name: string, names: GlyphNames, font: FontMetadata): Glyph {
  const codepoint = names[name]?.codepoint;
  const advance = font.glyphAdvanceWidths[name];
  if (codepoint === undefined || advance === undefined) {
    throw new Error(`${name} is not a glyph of this font.`);
  }

  const anchors = font.glyphsWithAnchors[name];

  return {
    codepoint,
    advance,
    ...anchorOf('stemUp', anchors?.stemUpSE),
    ...anchorOf('stemDown', anchors?.stemDownNW),
  };
}

function anchorOf(key: 'stemUp' | 'stemDown', anchor: readonly number[] | undefined) {
  const [x, y] = anchor ?? [];
  return x === undefined || y === undefined ? {} : { [key]: { x, y } };
}
