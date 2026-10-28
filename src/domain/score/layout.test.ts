import { describe, expect, it } from 'bun:test';
import { GLYPHS } from '@/domain/score/bravura';
import type { Engraving } from '@/domain/score/engraving';
import { layoutStaff, type Note, type StaffLayout } from '@/domain/score/layout';

const engraving: Engraving = {
  staffLineThickness: 0.13,
  legerLineThickness: 0.16,
  stemThickness: 0.12,
  legerLineExtension: 0.4,
  noteheadWidth: 1.18,
  noteSpacing: 3,
  clefWidth: 4,
};

function note(degree: Note['pitch']['degree'], octave: number, current = false): Note {
  return { pitch: { degree, octave }, current };
}

function staff(clef: Parameters<typeof layoutStaff>[0], notes: readonly Note[]): StaffLayout {
  return layoutStaff(clef, notes, engraving, GLYPHS);
}

function noteheads({ glyphs: placed }: StaffLayout) {
  return placed.filter((glyph) => glyph.glyph === 'noteheadBlack');
}

/** A staff line is the only segment that runs the whole width. */
function staffLines({ lines, width }: StaffLayout) {
  return lines.filter((line) => line.from.x === 0 && line.to.x === width);
}

function horizontals({ lines, width }: StaffLayout) {
  return lines.filter((line) => line.from.y === line.to.y && line.to.x !== width);
}

function verticals({ lines }: StaffLayout) {
  return lines.filter((line) => line.from.x === line.to.x);
}

describe('a staff', () => {
  it('draws five lines, one space apart, across the whole width', () => {
    expect(staffLines(staff('treble', [note('g', 4)])).map((line) => line.from.y)).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it('opens with the glyph of its clef, on the line that clef names', () => {
    expect(staff('treble', []).glyphs).toEqual([{ glyph: 'gClef', x: 0, y: 1, current: false }]);
    expect(staff('bass', []).glyphs).toEqual([{ glyph: 'fClef', x: 0, y: 3, current: false }]);
  });

  it('puts a notehead half a space up for every degree it climbs', () => {
    const layout = staff('treble', [note('e', 4), note('f', 4), note('g', 4)]);

    expect(noteheads(layout).map((glyph) => glyph.y)).toEqual([0, 0.5, 1]);
  });

  it('spaces the noteheads evenly after the clef', () => {
    const layout = staff('treble', [note('e', 4), note('e', 4), note('e', 4)]);

    expect(noteheads(layout).map((glyph) => glyph.x)).toEqual([4, 7, 10]);
  });

  it('marks the current note and no other', () => {
    const layout = staff('treble', [note('e', 4), note('f', 4, true), note('g', 4)]);

    expect(layout.glyphs.map((glyph) => glyph.current)).toEqual([false, false, true, false]);
  });

  it('carries a note four spaces above the staff on four leger lines, all above', () => {
    expect(horizontals(staff('treble', [note('g', 6)])).map((line) => line.from.y)).toEqual([
      5, 6, 7, 8,
    ]);
  });

  it('carries a note below the staff on leger lines below it', () => {
    expect(horizontals(staff('treble', [note('a', 3)])).map((line) => line.from.y)).toEqual([
      -1, -2,
    ]);
  });

  it('leaves a note in the space just outside the staff without a leger line', () => {
    expect(horizontals(staff('treble', [note('g', 5), note('d', 4)]))).toEqual([]);
  });

  it('draws a leger line wider than the notehead it carries, centred on it', () => {
    const layout = staff('treble', [note('c', 4)]);
    const [leger] = horizontals(layout);
    const [head] = noteheads(layout);

    expect(leger?.from.x).toBeCloseTo((head?.x as number) - 1.18 / 2 - 0.4, 10);
    expect(leger?.to.x).toBeCloseTo((head?.x as number) + 1.18 / 2 + 0.4, 10);
  });
});

describe('the current note', () => {
  it('carries its stem and its leger lines with it, and nothing else', () => {
    const layout = staff('treble', [note('c', 4), note('c', 4, true)]);
    const marked = layout.lines.filter((line) => line.current);

    expect(marked).toHaveLength(2);
    expect(marked.every((line) => line.from.x > (noteheads(layout)[0]?.x as number))).toBe(true);
  });

  it('leaves every staff line unmarked', () => {
    const layout = staff('treble', [note('c', 4, true)]);

    expect(staffLines(layout).some((line) => line.current)).toBe(false);
  });
});

describe('a stem', () => {
  it('rises from a note below the middle line', () => {
    const [stem] = verticals(staff('treble', [note('f', 4)]));

    expect((stem?.to.y as number) - (stem?.from.y as number)).toBe(3.5);
  });

  it('falls from a note above the middle line', () => {
    const [stem] = verticals(staff('treble', [note('d', 5)]));

    expect((stem?.to.y as number) - (stem?.from.y as number)).toBe(-3.5);
  });

  it('falls from a note on the middle line', () => {
    const [stem] = verticals(staff('treble', [note('b', 4)]));

    expect((stem?.to.y as number) - (stem?.from.y as number)).toBe(-3.5);
  });

  it('leaves a rising note at the right of its head, where the font says', () => {
    const layout = staff('treble', [note('f', 4)]);
    const [stem] = verticals(layout);
    const [head] = noteheads(layout);

    expect(stem?.from).toEqual({ x: (head?.x as number) + 1.18, y: (head?.y as number) + 0.168 });
  });

  it('leaves a falling note at the left of its head, where the font says', () => {
    const layout = staff('treble', [note('d', 5)]);
    const [stem] = verticals(layout);
    const [head] = noteheads(layout);

    expect(stem?.from).toEqual({ x: head?.x as number, y: (head?.y as number) - 0.168 });
  });

  it('gives each note one stem, at the stem thickness the font publishes', () => {
    const layout = staff('treble', [note('e', 4), note('g', 5)]);

    expect(verticals(layout).map((stem) => stem.thickness)).toEqual([0.12, 0.12]);
  });
});
