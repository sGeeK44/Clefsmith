/**
 * Bravura 1.482, the numbers of it this application draws with.
 *
 * Generated — see `tools/smufl/extract.ts` for the command that rebuilds it. Edit
 * that, never this.
 */
import type { Glyphs } from '@/domain/score/glyph';

export const ENGRAVING_DEFAULTS = {
  staffLineThickness: 0.13,
  legerLineThickness: 0.16,
  legerLineExtension: 0.4,
  stemThickness: 0.12,
  thinBarlineThickness: 0.16,
  thickBarlineThickness: 0.5,
  barlineSeparation: 0.4,
} as const;

export const GLYPHS: Glyphs = {
  gClef: {
    codepoint: 'U+E050',
    advance: 2.684,
    top: 4.392,
    bottom: -2.632,
  },
  fClef: {
    codepoint: 'U+E062',
    advance: 2.736,
    top: 1.048,
    bottom: -2.54,
  },
  noteheadBlack: {
    codepoint: 'U+E0A4',
    advance: 1.18,
    top: 0.5,
    bottom: -0.5,
    stemUp: {
      x: 1.18,
      y: 0.168,
    },
    stemDown: {
      x: 0,
      y: -0.168,
    },
  },
};
