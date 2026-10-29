/**
 * What the learner sets before a session, and what the session does with it.
 *
 * None of it is written down: it is chosen for the session about to be played
 * and is gone with it. The bounds live here rather than on the screen that shows
 * them so that they hold wherever a session is started from.
 */

export const MEASURES = [4, 8, 12, 16] as const;

export type Measures = (typeof MEASURES)[number];

const SLOWEST = 40;
const FASTEST = 160;
const STEP = 10;

/** Four beats to a measure, one note to a beat. */
const NOTES_PER_MEASURE = 4;

export interface SessionSettings {
  readonly tempo: number;
  readonly measures: Measures;
  readonly metronome: boolean;
}

/**
 * Sixty to the minute, eight measures, no metronome.
 *
 * A beat a second is the one tempo a learner can count without being taught how,
 * and the metronome is off because the first mode has no rhythm to keep.
 */
export function defaultSessionSettings(): SessionSettings {
  return { tempo: 60, measures: 8, metronome: false };
}

export function faster(tempo: number): number {
  return Math.min(FASTEST, tempo + STEP);
}

export function slower(tempo: number): number {
  return Math.max(SLOWEST, tempo - STEP);
}

/** How many exercises a session of so many measures holds. */
export function exercisesIn(measures: Measures): number {
  return measures * NOTES_PER_MEASURE;
}
