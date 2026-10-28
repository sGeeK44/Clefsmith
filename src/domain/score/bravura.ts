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
} as const;

export const GLYPHS: Glyphs = {
  gClef: {
    codepoint: 'U+E050',
    advance: 2.684,
  },
  fClef: {
    codepoint: 'U+E062',
    advance: 2.736,
  },
  noteheadBlack: {
    codepoint: 'U+E0A4',
    advance: 1.18,
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
