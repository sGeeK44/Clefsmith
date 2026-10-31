import { describe, expect, it } from 'bun:test';
import { GLYPHS } from '@/domain/score/bravura';
import { ENGRAVING, spreadOver } from '@/domain/score/engraving';

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

describe('an engraving spread over the width it is given', () => {
  it('divides what is left after the clef between the notes', () => {
    const spread = spreadOver(ENGRAVING, 4, ENGRAVING.clefWidth + 40);

    expect(spread.noteSpacing).toBe(10);
  });

  it('ends the last note short of the width by one spacing, which is where the staff ends', () => {
    const notes = 4;
    const width = ENGRAVING.clefWidth + 40;
    const spread = spreadOver(ENGRAVING, notes, width);

    expect(spread.clefWidth + notes * spread.noteSpacing).toBe(width);
  });

  it('leaves everything but the spacing alone', () => {
    const spread = spreadOver(ENGRAVING, 4, ENGRAVING.clefWidth + 40);

    expect({ ...spread, noteSpacing: ENGRAVING.noteSpacing }).toEqual(ENGRAVING);
  });

  it('keeps the engraved spacing when the width on offer would squeeze the notes', () => {
    const spread = spreadOver(ENGRAVING, 8, ENGRAVING.clefWidth + 8);

    expect(spread.noteSpacing).toBe(ENGRAVING.noteSpacing);
  });

  it('keeps the engraved spacing when there is no width to go on yet', () => {
    expect(spreadOver(ENGRAVING, 8, 0).noteSpacing).toBe(ENGRAVING.noteSpacing);
  });
});
