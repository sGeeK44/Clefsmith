import { describe, expect, it } from 'bun:test';
import { GLYPHS } from '@/domain/score/bravura';
import { ENGRAVING } from '@/domain/score/engraving';

describe('the engraving the application draws with', () => {
  it('takes its notehead width from the glyph it will actually draw', () => {
    expect(ENGRAVING.noteheadWidth).toBe(GLYPHS.noteheadBlack.advance);
  });

  it('leaves room for the wider of the two clefs, and some air after it', () => {
    expect(ENGRAVING.clefWidth).toBeGreaterThan(GLYPHS.gClef.advance);
    expect(ENGRAVING.clefWidth).toBeGreaterThan(GLYPHS.fClef.advance);
  });

  it('spaces notes further apart than a notehead is wide', () => {
    expect(ENGRAVING.noteSpacing).toBeGreaterThan(ENGRAVING.noteheadWidth);
  });
});
