import type { Clef } from '@/domain/notation/clef';
import { pitchOn } from '@/domain/notation/clef';
import type { Pitch } from '@/domain/notation/pitch';

export const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type Level = (typeof LEVELS)[number];

/**
 * The lowest and highest position a level draws from, in half-spaces from the
 * bottom line of the staff — the unit `staffPosition` counts in.
 *
 * The two clefs do **not** share the six rules, and that is the point: both walk
 * outwards from middle C, which sits one leger line below the treble staff and
 * one leger line above the bass staff. The treble starts on it and climbs away;
 * the bass starts on its own bottom line and climbs until it reaches it.
 *
 * Level 6 draws from the same notes as level 5. It is not a wider staff, it is
 * the same staff read faster, which is why it brings no new note.
 */
const POSITIONS: Record<Clef, Record<Level, readonly [number, number]>> = {
  treble: { 1: [-2, 0], 2: [-2, 2], 3: [-2, 4], 4: [-2, 6], 5: [-4, 10], 6: [-4, 10] },
  bass: { 1: [0, 2], 2: [0, 4], 3: [0, 6], 4: [0, 8], 5: [-2, 10], 6: [-2, 10] },
};

/** The pitches a level draws from, read by the clef, lowest first. */
export function poolOf(clef: Clef, level: Level): readonly Pitch[] {
  return positionsOf(clef, level).map((position) => pitchOn(clef, position));
}

/**
 * The pitches this level brings that the one below it does not draw.
 *
 * Worked out rather than written down, so the table above stays the only place a
 * level is defined. Level 1 is all new, and level 6 brings nothing.
 */
export function newcomersOf(clef: Clef, level: Level): readonly Pitch[] {
  if (level === 1) {
    return poolOf(clef, level);
  }

  const [lowest, highest] = POSITIONS[clef][(level - 1) as Level];

  return positionsOf(clef, level)
    .filter((position) => position < lowest || position > highest)
    .map((position) => pitchOn(clef, position));
}

function positionsOf(clef: Clef, level: Level): readonly number[] {
  const [lowest, highest] = POSITIONS[clef][level];

  return Array.from({ length: highest - lowest + 1 }, (_, step) => lowest + step);
}
