import { describe, expect, it } from 'bun:test';

import { type FontMetadata, type GlyphNames, glyphOf } from './metadata';

const names: GlyphNames = {
  noteheadBlack: { codepoint: 'U+E0A4' },
  gClef: { codepoint: 'U+E050' },
};

const font: FontMetadata = {
  glyphAdvanceWidths: { noteheadBlack: 1.18, gClef: 2.684, fClef: 2.736 },
  glyphsWithAnchors: {
    noteheadBlack: {
      cutOutNW: [0.208, 0.3],
      stemDownNW: [0, -0.168],
      stemUpSE: [1.18, 0.168],
    },
  },
};

describe('a glyph read out of SMuFL metadata', () => {
  it('carries the codepoint of the names table and the advance of the font', () => {
    expect(glyphOf('gClef', names, font)).toEqual({ codepoint: 'U+E050', advance: 2.684 });
  });

  it('carries the two stem anchors, and no other anchor the font publishes', () => {
    expect(glyphOf('noteheadBlack', names, font)).toEqual({
      codepoint: 'U+E0A4',
      advance: 1.18,
      stemUp: { x: 1.18, y: 0.168 },
      stemDown: { x: 0, y: -0.168 },
    });
  });

  it('refuses a glyph the names table does not hold, however well the font draws it', () => {
    expect(() => glyphOf('fClef', names, font)).toThrow('fClef is not a glyph of this font.');
  });

  it('refuses a glyph the font does not hold, however well SMuFL names it', () => {
    const named: GlyphNames = { ...names, restQuarter: { codepoint: 'U+E4E5' } };

    expect(() => glyphOf('restQuarter', named, font)).toThrow(
      'restQuarter is not a glyph of this font.',
    );
  });
});
