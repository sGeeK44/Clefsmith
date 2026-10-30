import { describe, expect, it } from 'bun:test';
import { CLEFS, type Clef, staffPosition } from '@/domain/notation/clef';
import type { Pitch } from '@/domain/notation/pitch';
import { GLYPHS } from '@/domain/score/bravura';
import { ENGRAVING } from '@/domain/score/engraving';
import { layoutStaff } from '@/domain/score/layout';
import { LEVELS, type Level, newcomersOf, poolOf } from '@/domain/training/level';

function named(pitches: readonly Pitch[]): string[] {
  return pitches.map((pitch) => `${pitch.degree}${pitch.octave}`);
}

/** How many leger lines the engine draws for the lowest and the highest note of a level. */
function legerLines(clef: Clef, level: Level): number[] {
  const pool = poolOf(clef, level);

  return [pool[0] as Pitch, pool.at(-1) as Pitch].map(
    (pitch) =>
      layoutStaff(clef, [{ pitch, shade: 'ahead' }], ENGRAVING, GLYPHS).lines.filter(
        (line) => line.from.y === line.to.y && line.from.x !== 0,
      ).length,
  );
}

describe('the pool of a level', () => {
  it('is three notes at level 1, read by the treble clef', () => {
    expect(named(poolOf('treble', 1))).toEqual(['c4', 'd4', 'e4']);
  });

  it('is three other notes at level 1, read by the bass clef', () => {
    expect(named(poolOf('bass', 1))).toEqual(['g2', 'a2', 'b2']);
  });

  it('holds every note of the level below it, in both clefs', () => {
    for (const clef of CLEFS) {
      for (const level of [2, 3, 4, 5, 6] as const) {
        const below = named(poolOf(clef, (level - 1) as Level));

        expect(named(poolOf(clef, level)).filter((note) => below.includes(note))).toEqual(below);
      }
    }
  });

  it('climbs, so a test can write it out in full', () => {
    for (const clef of CLEFS) {
      for (const level of LEVELS) {
        const positions = poolOf(clef, level).map((pitch) => staffPosition(clef, pitch));

        expect(positions).toEqual([...positions].sort((one, other) => one - other));
      }
    }
  });

  it('walks outwards from middle C: the treble leaves it, the bass reaches it', () => {
    expect(named(poolOf('treble', 1))).toContain('c4');
    expect(named(poolOf('bass', 4))).not.toContain('c4');
    expect(named(poolOf('bass', 5))).toContain('c4');
  });

  it('spans three octaves of leger lines at level 5', () => {
    expect([named(poolOf('treble', 5)).at(0), named(poolOf('treble', 5)).at(-1)]).toEqual([
      'a3',
      'a5',
    ]);
    expect([named(poolOf('bass', 5)).at(0), named(poolOf('bass', 5)).at(-1)]).toEqual(['e2', 'c4']);
  });

  it('is the same at level 6 as at level 5, in both clefs — only the tempo moves', () => {
    for (const clef of CLEFS) {
      expect(named(poolOf(clef, 6))).toEqual(named(poolOf(clef, 5)));
    }
  });

  it('asks the engine for two leger lines under the treble staff, and one over it', () => {
    expect(legerLines('treble', 5)).toEqual([2, 1]);
  });

  it('asks for one on each side under the bass clef, which sits lower on the keyboard', () => {
    expect(legerLines('bass', 5)).toEqual([1, 1]);
  });
});

describe('the notes a level brings', () => {
  it('is the whole pool at level 1, which has nothing below it', () => {
    for (const clef of CLEFS) {
      expect(newcomersOf(clef, 1)).toEqual(poolOf(clef, 1));
    }
  });

  it('is what the level below did not draw', () => {
    expect(named(newcomersOf('treble', 2))).toEqual(['f4', 'g4']);
    expect(named(newcomersOf('bass', 2))).toEqual(['c3', 'd3']);
  });

  it('reaches on both sides at once when the staff widens', () => {
    expect(named(newcomersOf('treble', 5))).toEqual(['a3', 'b3', 'e5', 'f5', 'g5', 'a5']);
  });

  it('is empty at level 6, which brings none', () => {
    for (const clef of CLEFS) {
      expect(newcomersOf(clef, 6)).toEqual([]);
    }
  });

  it('is always part of the pool it belongs to', () => {
    for (const clef of CLEFS) {
      for (const level of LEVELS) {
        const pool = named(poolOf(clef, level));

        expect(named(newcomersOf(clef, level)).every((note) => pool.includes(note))).toBe(true);
      }
    }
  });
});
