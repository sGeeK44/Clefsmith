import { describe, expect, it } from 'bun:test';
import type { Random } from '@/core/random';
import type { Pitch } from '@/domain/notation/pitch';
import { poolOf } from '@/domain/training/level';
import { sessionOf } from '@/domain/training/session';

/** Honours the port's contract: every number it hands out is in [0, 1). */
function replaying(...numbers: readonly number[]): Random {
  let step = 0;

  return {
    next: () => numbers[step++ % numbers.length] as number,
  };
}

function named(pitches: readonly Pitch[]): string[] {
  return pitches.map((pitch) => `${pitch.degree}${pitch.octave}`);
}

const pool = poolOf('treble', 1);

describe('a session', () => {
  it('is as long as it was asked to be', () => {
    expect(sessionOf(pool, 20, replaying(0.1, 0.7, 0.4))).toHaveLength(20);
  });

  it('draws every pitch from the pool it was given', () => {
    const drawn = named(sessionOf(pool, 20, replaying(0.1, 0.7, 0.4, 0.9)));

    expect(drawn.every((pitch) => named(pool).includes(pitch))).toBe(true);
  });

  it('never repeats a pitch, even when the chance always points at the same place', () => {
    expect(named(sessionOf(pool, 4, replaying(0)))).toEqual(['e4', 'g4', 'e4', 'g4']);
  });

  it('picks the pitch the chance points at, among those still allowed', () => {
    // Half of five is b4; then half of the four that are left is d5; then half of
    // the four that are left again is b4 once more.
    expect(named(sessionOf(pool, 3, replaying(0.5)))).toEqual(['b4', 'd5', 'b4']);
  });

  it('replays identically from the same chance', () => {
    const numbers = [0.3, 0.8, 0.05, 0.6];

    expect(sessionOf(pool, 10, replaying(...numbers))).toEqual(
      sessionOf(pool, 10, replaying(...numbers)),
    );
  });

  it('refuses a pool too small to avoid repeating itself', () => {
    expect(() => sessionOf(pool.slice(0, 1), 2, replaying(0))).toThrow(
      'A session of more than one exercise needs a pool of more than one pitch.',
    );
  });

  it('still gives one exercise from a pool of one', () => {
    expect(named(sessionOf(pool.slice(0, 1), 1, replaying(0)))).toEqual(['e4']);
  });

  it('is empty when nothing was asked for', () => {
    expect(sessionOf(pool, 0, replaying(0))).toEqual([]);
  });
});
