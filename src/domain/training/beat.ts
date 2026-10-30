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

/**
 * How far from its beat an answer may start and still be in time, as a share of
 * the beat rather than a number of milliseconds.
 *
 * Half a beat either side, which is the whole beat and nothing of its
 * neighbours. A window written in milliseconds would be half a beat at forty to
 * the minute and more than a whole one at a hundred and sixty — the same window
 * would mean "strict" at one tempo and "anything goes" at the other.
 */
const TOLERANCE = 0.5;

export type Timing = 'in-time' | 'off-beat';

/** Whether an utterance started close enough to the beat it answers. */
export function timingOf(startedAt: number, beat: number, tempo: number): Timing {
  return Math.abs(startedAt - beat) <= TOLERANCE * beatIntervalMs(tempo) ? 'in-time' : 'off-beat';
}
