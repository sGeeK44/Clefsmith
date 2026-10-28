import { type Clef, pitchOn } from '@/domain/notation/clef';
import type { Pitch } from '@/domain/notation/pitch';

export const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type Level = (typeof LEVELS)[number];

/**
 * Which positions on the staff a level draws from, in half-spaces from the bottom
 * line — the unit `staffPosition` counts in.
 *
 * A level is a set of positions and not a list of notes, so that both clefs share
 * the same six rules: the clef turns a position into a pitch, and two hand-written
 * lists would drift apart at the first adjustment.
 *
 * Level 4 is the anchor: it is the range the previous application shipped as its
 * default. Below it the staff is being learnt, above it the staff is being left.
 */
const POSITIONS: Record<Level, readonly number[]> = {
  1: lines(),
  2: spaces(),
  3: between(0, 8),
  4: between(-2, 10),
  5: between(-4, 12),
  6: between(-6, 14),
};

/** The five staff lines. */
function lines(): readonly number[] {
  return between(0, 8).filter((position) => position % 2 === 0);
}

/** The four spaces between them. */
function spaces(): readonly number[] {
  return between(0, 8).filter((position) => position % 2 !== 0);
}

function between(lowest: number, highest: number): readonly number[] {
  return Array.from({ length: highest - lowest + 1 }, (_, step) => lowest + step);
}

/** The pitches a level draws from, read by the clef, lowest first. */
export function poolOf(clef: Clef, level: Level): readonly Pitch[] {
  return POSITIONS[level].map((position) => pitchOn(clef, position));
}
