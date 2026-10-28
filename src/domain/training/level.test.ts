import { describe, expect, it } from 'bun:test';
import { staffPosition } from '@/domain/notation/clef';
import type { Pitch } from '@/domain/notation/pitch';
import { GLYPHS } from '@/domain/score/bravura';
import { ENGRAVING } from '@/domain/score/engraving';
import { layoutStaff } from '@/domain/score/layout';
import { LEVELS, type Level, poolOf } from '@/domain/training/level';

function named(pitches: readonly Pitch[]): string[] {
  return pitches.map((pitch) => `${pitch.degree}${pitch.octave}`);
}

describe('the pool of a level', () => {
  it('is the five staff lines at level 1, read by the treble clef', () => {
    expect(named(poolOf('treble', 1))).toEqual(['e4', 'g4', 'b4', 'd5', 'f5']);
  });

  it('is the same five positions at level 1, read by the bass clef', () => {
    expect(named(poolOf('bass', 1))).toEqual(['g2', 'b2', 'd3', 'f3', 'a3']);
  });

  it('is the four spaces at level 2, sharing nothing with the lines', () => {
    const lines = named(poolOf('treble', 1));

    expect(named(poolOf('treble', 2))).toEqual(['f4', 'a4', 'c5', 'e5']);
    expect(named(poolOf('treble', 2)).some((note) => lines.includes(note))).toBe(false);
  });

  it('is the whole staff at level 3', () => {
    expect(poolOf('treble', 3)).toHaveLength(9);
    expect(named(poolOf('treble', 3))).toContain('e4');
    expect(named(poolOf('treble', 3))).toContain('f5');
  });

  it('grows by one leger line on each side per level, from level 3 up', () => {
    expect([3, 4, 5, 6].map((level) => poolOf('treble', level as Level).length)).toEqual([
      9, 13, 17, 21,
    ]);
  });

  it('contains every pitch of the level below it, from level 3 up', () => {
    for (const level of [4, 5, 6] as const) {
      const below = named(poolOf('treble', (level - 1) as Level));

      expect(named(poolOf('treble', level)).filter((note) => below.includes(note))).toEqual(below);
    }
  });

  it('climbs, so a test can write it out in full', () => {
    for (const level of LEVELS) {
      const positions = poolOf('bass', level).map((pitch) => staffPosition('bass', pitch));

      expect(positions).toEqual([...positions].sort((one, other) => one - other));
    }
  });

  it('reaches exactly three leger lines out on each side at level 6', () => {
    const extremes = [poolOf('treble', 6)[0] as Pitch, poolOf('treble', 6).at(-1) as Pitch];

    expect(
      extremes.map(
        (pitch) =>
          layoutStaff('treble', [{ pitch, current: false }], ENGRAVING, GLYPHS).lines.filter(
            (line) => line.from.y === line.to.y && line.from.x !== 0,
          ).length,
      ),
    ).toEqual([3, 3]);
  });
});
