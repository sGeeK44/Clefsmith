import { NOTES_PER_MEASURE } from '@/domain/training/session-settings';

/**
 * The grid a rhythmic session is read on, derived from the tempo and written
 * down nowhere.
 *
 * One beat to a note and four beats to a measure, so the grid is the tempo and
 * nothing else. A session that stored its beats would hold a second copy of a
 * number the learner can change, and the two would disagree the first time it
 * did.
 */

const MINUTE = 60_000;

/** How long one beat lasts, at so many to the minute. */
export function beatIntervalMs(tempo: number): number {
  return MINUTE / tempo;
}

/**
 * When the nth beat of a session falls, counted from its first note.
 *
 * An instant from the start rather than a wait between two beats: a wait
 * accumulates whatever happened since the last one, and a session paced that
 * way runs late by more at every measure.
 */
export function beatAt(startedAt: number, beat: number, tempo: number): number {
  return startedAt + beat * beatIntervalMs(tempo);
}

/** Which of the four beats of its measure a note falls on, counted from zero. */
export function beatOf(at: number): number {
  return at % NOTES_PER_MEASURE;
}
