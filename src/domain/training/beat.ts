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

/** What one utterance was worth against its beat: which beat, the verdict, and how far off. */
export interface Beating {
  readonly timing: Timing;
  /** Signed milliseconds — negative said early, positive said late. */
  readonly offset: number;
  /**
   * How many beats before the one passing the utterance started on.
   *
   * Nought for an answer settled within the beat it was said on, and that is
   * not the ordinary case: naming a note takes time and a decoder takes more,
   * so by the time a word is settled the grid has usually moved on. Without
   * this the answer would be judged against whatever note the move left under
   * the cursor — the note after the one the learner was reading.
   */
  readonly behind: number;
}

/**
 * Which beat an utterance belongs to, and how close to it the learner started.
 *
 * The beat it belongs to is the one that was **passing when they started
 * speaking**, whatever has passed since: a word is counted from the start of
 * the utterance backwards, not from the instant it was understood.
 *
 * Backwards by whole beats and never by a half. The beat a note was said on is
 * the one it was shown on, and rounding to the nearest would move an answer
 * said late onto the next note and call it on time — the off-beat verdict
 * deleting itself.
 */
export function beatingOf(startedAt: number, beat: number, tempo: number): Beating {
  const interval = beatIntervalMs(tempo);
  const behind = Math.max(0, Math.ceil((beat - startedAt) / interval));
  const offset = startedAt - (beat - behind * interval);

  return {
    behind,
    offset,
    timing: Math.abs(offset) <= TOLERANCE * interval ? 'in-time' : 'off-beat',
  };
}

/**
 * How far either side of its own beat the meter reaches, in beats.
 *
 * Three times the tolerance, so the band in the middle is a third of the track:
 * wide enough to aim at, narrow enough that hitting it means something. A track
 * scaled to anything else would draw a band whose width says nothing about the
 * rule it stands for.
 */
const TRACK = 3 * TOLERANCE;

/** Where the in-time band starts and ends on the track, as shares of its width. */
export const BAND = {
  from: (TRACK - TOLERANCE) / (2 * TRACK),
  to: (TRACK + TOLERANCE) / (2 * TRACK),
} as const;

/**
 * Where an utterance sits on that track, from nought at its early end to one at
 * its late end. Anything further off is held at the end it ran past: a cursor
 * drawn outside the track is a cursor nobody can read.
 */
export function meterOf(offset: number, tempo: number): number {
  const span = 2 * TRACK * beatIntervalMs(tempo);

  return Math.min(Math.max(offset / span + 0.5, 0), 1);
}
