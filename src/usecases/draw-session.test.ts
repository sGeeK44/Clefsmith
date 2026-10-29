import { describe, expect, it } from 'bun:test';
import type { Random } from '@/core/random';
import { createDrawSession } from '@/usecases/draw-session';

/** Always the first choice on offer, so that what is drawn says what was offered. */
const first: Random = { next: () => 0 };

/** Chance read off a list, so that a draw is a fact rather than a distribution. */
function chance(values: readonly number[]): Random {
  let at = 0;

  return { next: () => values[at++ % values.length] as number };
}

describe('drawing the notes of a session', () => {
  it('draws four notes per measure', () => {
    const drawn = createDrawSession(first)({
      clef: 'treble',
      level: 3,
      measures: 4,
      degrees: [],
    });

    expect(drawn).toHaveLength(16);
  });

  it('draws a revision from the degrees it aims at, and from nothing else', () => {
    const drawn = createDrawSession(chance([0.9, 0.1, 0.5, 0.8, 0.3, 0.6]))({
      clef: 'treble',
      level: 5,
      measures: 4,
      degrees: ['a', 'b'],
    });

    expect(new Set(drawn.map((pitch) => pitch.degree))).toEqual(new Set(['a', 'b']));
  });

  it('brings no new note into a revision, the one thing that would reach outside its degrees', () => {
    const drawn = createDrawSession(first)({
      clef: 'treble',
      level: 5,
      measures: 4,
      degrees: ['a', 'b'],
    });

    expect(new Set(drawn.map((pitch) => pitch.degree))).toEqual(new Set(['a', 'b']));
  });

  it('draws a study from the whole pool, and not from a corner of it', () => {
    const drawn = createDrawSession(chance([0.9, 0.1, 0.5, 0.8, 0.3, 0.6]))({
      clef: 'treble',
      level: 3,
      measures: 4,
      degrees: [],
    });

    expect(new Set(drawn.map((pitch) => pitch.degree)).size).toBeGreaterThan(2);
  });
});
