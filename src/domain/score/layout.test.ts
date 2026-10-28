import { describe, expect, it } from 'bun:test';
import type { Engraving } from '@/domain/score/engraving';
import { layoutStaff, type Note } from '@/domain/score/layout';

const engraving: Engraving = {
  staffLineThickness: 0.13,
  legerLineThickness: 0.16,
  legerLineExtension: 0.4,
  noteheadWidth: 1.18,
  noteSpacing: 3,
  clefWidth: 4,
};

function note(degree: Note['pitch']['degree'], octave: number, current = false): Note {
  return { pitch: { degree, octave }, current };
}

describe('a staff', () => {
  it('draws five lines, one space apart, across the whole width', () => {
    const { lines, width } = layoutStaff('treble', [note('g', 4)], engraving);
    const staff = lines.filter((line) => line.from === 0 && line.to === width);

    expect(staff.map((line) => line.y)).toEqual([0, 1, 2, 3, 4]);
  });

  it('opens with the glyph of its clef, on the line that clef names', () => {
    expect(layoutStaff('treble', [], engraving).glyphs).toEqual([
      { glyph: 'gClef', x: 0, y: 1, current: false },
    ]);
    expect(layoutStaff('bass', [], engraving).glyphs).toEqual([
      { glyph: 'fClef', x: 0, y: 3, current: false },
    ]);
  });

  it('puts a notehead half a space up for every degree it climbs', () => {
    const { glyphs } = layoutStaff('treble', [note('e', 4), note('f', 4), note('g', 4)], engraving);

    expect(
      glyphs.filter((glyph) => glyph.glyph === 'noteheadBlack').map((glyph) => glyph.y),
    ).toEqual([0, 0.5, 1]);
  });

  it('spaces the noteheads evenly after the clef', () => {
    const { glyphs } = layoutStaff('treble', [note('e', 4), note('e', 4), note('e', 4)], engraving);

    expect(
      glyphs.filter((glyph) => glyph.glyph === 'noteheadBlack').map((glyph) => glyph.x),
    ).toEqual([4, 7, 10]);
  });

  it('marks the current note and no other', () => {
    const { glyphs } = layoutStaff(
      'treble',
      [note('e', 4), note('f', 4, true), note('g', 4)],
      engraving,
    );

    expect(glyphs.map((glyph) => glyph.current)).toEqual([false, false, true, false]);
  });

  it('carries a note four spaces above the staff on four leger lines, all above', () => {
    const { lines, width } = layoutStaff('treble', [note('g', 6)], engraving);
    const leger = lines.filter((line) => line.to !== width);

    expect(leger.map((line) => line.y)).toEqual([5, 6, 7, 8]);
  });

  it('carries a note below the staff on leger lines below it', () => {
    const { lines, width } = layoutStaff('treble', [note('a', 3)], engraving);
    const leger = lines.filter((line) => line.to !== width);

    expect(leger.map((line) => line.y)).toEqual([-1, -2]);
  });

  it('leaves a note in the space just outside the staff without a leger line', () => {
    const { lines, width } = layoutStaff('treble', [note('g', 5), note('d', 4)], engraving);

    expect(lines.filter((line) => line.to !== width)).toEqual([]);
  });

  it('draws a leger line wider than the notehead it carries, centred on it', () => {
    const { lines, glyphs, width } = layoutStaff('treble', [note('c', 4)], engraving);
    const [leger] = lines.filter((line) => line.to !== width);
    const [head] = glyphs.filter((glyph) => glyph.glyph === 'noteheadBlack');

    expect(leger?.from).toBeCloseTo((head?.x as number) - 1.18 / 2 - 0.4, 10);
    expect(leger?.to).toBeCloseTo((head?.x as number) + 1.18 / 2 + 0.4, 10);
  });
});
