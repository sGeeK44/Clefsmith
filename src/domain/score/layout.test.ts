import { describe, expect, it } from 'bun:test';
import { GLYPHS } from '@/domain/score/bravura';
import type { Engraving } from '@/domain/score/engraving';
import {
  type Barring,
  layoutStaff,
  type Note,
  type Shade,
  type StaffLayout,
} from '@/domain/score/layout';

const engraving: Engraving = {
  staffLineThickness: 0.13,
  legerLineThickness: 0.16,
  stemThickness: 0.12,
  legerLineExtension: 0.4,
  noteheadWidth: 1.18,
  noteSpacing: 3,
  clefWidth: 4,
  thinBarlineThickness: 0.16,
  thickBarlineThickness: 0.5,
  barlineSeparation: 0.4,
};

function note(degree: Note['pitch']['degree'], octave: number, shade: Shade = 'ahead'): Note {
  return { pitch: { degree, octave }, shade };
}

function staff(
  clef: Parameters<typeof layoutStaff>[0],
  notes: readonly Note[],
  barring?: Barring,
): StaffLayout {
  return layoutStaff(clef, notes, engraving, GLYPHS, barring);
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
    expect(staff('treble', []).glyphs).toEqual([{ glyph: 'gClef', x: 0, y: 1, shade: 'ahead' }]);
    expect(staff('bass', []).glyphs).toEqual([{ glyph: 'fClef', x: 0, y: 3, shade: 'ahead' }]);
  });

  it('puts a notehead half a space up for every degree it climbs', () => {
    const layout = staff('treble', [note('e', 4), note('f', 4), note('g', 4)]);

    expect(noteheads(layout).map((glyph) => glyph.y)).toEqual([0, 0.5, 1]);
  });

  it('spaces the noteheads evenly after the clef', () => {
    const layout = staff('treble', [note('e', 4), note('e', 4), note('e', 4)]);

    expect(noteheads(layout).map((glyph) => glyph.x)).toEqual([4, 7, 10]);
  });

  it('shades each note as it was asked to and no other', () => {
    const layout = staff('treble', [note('e', 4, 'ok'), note('f', 4, 'current'), note('g', 4)]);

    expect(layout.glyphs.map((glyph) => glyph.shade)).toEqual(['ahead', 'ok', 'current', 'ahead']);
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

  /**
   * A glyph is placed at the origin it is drawn from, which for a notehead is its
   * left edge — the stem anchors say so, leaving the head at `x + advance` going
   * up. A leger line centred on that number instead sits half a notehead to the
   * left of the note it carries, which is what middle C showed under the staff.
   */
  it('draws a leger line wider than the notehead it carries, centred on it', () => {
    const layout = staff('treble', [note('c', 4)]);
    const [leger] = horizontals(layout);
    const [head] = noteheads(layout);
    const centre = (head?.x as number) + 1.18 / 2;

    expect(((leger?.from.x as number) + (leger?.to.x as number)) / 2).toBeCloseTo(centre, 10);
    expect((leger?.to.x as number) - (leger?.from.x as number)).toBeCloseTo(1.18 + 2 * 0.4, 10);
  });
});

describe('the extent of a staff', () => {
  it('holds every line and every glyph it draws', () => {
    const layout = staff('treble', [note('c', 3), note('b', 4, 'current'), note('g', 6)]);
    const reach = [
      ...layout.lines.flatMap((line) => [line.from.y, line.to.y]),
      ...layout.glyphs.map((glyph) => glyph.y + GLYPHS[glyph.glyph].top),
      ...layout.glyphs.map((glyph) => glyph.y + GLYPHS[glyph.glyph].bottom),
    ];

    expect(Math.max(...reach)).toBeLessThanOrEqual(layout.top);
    expect(Math.min(...reach)).toBeGreaterThanOrEqual(layout.bottom);
  });

  it('reaches past the staff for the clef alone, which is taller than it', () => {
    const layout = staff('treble', []);

    expect(layout.top).toBeGreaterThan(4);
    expect(layout.bottom).toBeLessThan(0);
  });

  it('grows for a stem that leaves the staff where no glyph does', () => {
    const layout = staff('bass', [note('e', 3)]);
    const [stem] = verticals(layout);

    expect(layout.bottom).toBeLessThanOrEqual(stem?.to.y as number);
  });

  it('grows with the leger lines a note needs', () => {
    const inside = staff('treble', [note('b', 4)]);
    const below = staff('treble', [note('c', 3)]);

    expect(below.bottom).toBeLessThan(inside.bottom);
  });
});

describe('a shaded note', () => {
  it('carries its stem and its leger lines with it, and nothing else', () => {
    const layout = staff('treble', [note('c', 4), note('c', 4, 'current')]);
    const marked = layout.lines.filter((line) => line.shade === 'current');

    expect(marked).toHaveLength(2);
    expect(marked.every((line) => line.from.x > (noteheads(layout)[0]?.x as number))).toBe(true);
  });

  it('leaves every staff line at the shade of a note nobody has reached', () => {
    const layout = staff('treble', [note('c', 4, 'current')]);

    expect(staffLines(layout).every((line) => line.shade === 'ahead')).toBe(true);
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

describe('the barlines of a reading', () => {
  const four = [note('e', 4), note('f', 4), note('g', 4), note('a', 4)];

  it('draws none where nothing says how long a measure is', () => {
    expect(verticals(staff('treble', four))).toHaveLength(4);
  });

  it('closes each measure, halfway between the measure and what follows it', () => {
    const layout = staff('treble', [...four, ...four], { every: 4, ends: false });
    const bars = verticals(layout).filter((line) => line.to.y === 4);

    expect(bars.map((line) => line.from.x)).toEqual([14.5, 26.5]);
  });

  it('closes a short last measure where the notes actually stop', () => {
    const layout = staff('treble', [...four, note('e', 4)], { every: 4, ends: false });
    const bars = verticals(layout).filter((line) => line.to.y === 4);

    expect(bars.map((line) => line.from.x)).toEqual([14.5, 17.5]);
  });

  it('ends the piece on a thin stroke, a gap and a thick one', () => {
    const layout = staff('treble', four, { every: 4, ends: true });
    const bars = verticals(layout).filter((line) => line.to.y === 4);

    expect(bars.map((line) => line.thickness)).toEqual([0.16, 0.5]);
    expect((bars[1]?.from.x as number) - (bars[0]?.from.x as number)).toBeCloseTo(0.73);
  });

  it('leaves the measures before the last one closed like any other', () => {
    const layout = staff('treble', [...four, ...four], { every: 4, ends: true });
    const bars = verticals(layout).filter((line) => line.to.y === 4);

    expect(bars.map((line) => line.thickness)).toEqual([0.16, 0.16, 0.5]);
  });

  it('spans the staff and nothing more, carrying no shade of its own', () => {
    const layout = staff('treble', four, { every: 4, ends: false });
    const [bar] = verticals(layout).filter((line) => line.to.y === 4);

    expect(bar?.from.y).toBe(0);
    expect(bar?.shade).toBe('ahead');
  });
});
