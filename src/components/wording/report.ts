import { tempoOf } from '@/components/wording/study';
import type { Clef } from '@/domain/notation/clef';
import type { Level } from '@/domain/training/level';

/**
 * What the report screen says, in the learner's words.
 *
 * The figures are the domain's; what is here is the sentence put on them, and
 * where a figure stops being praise and becomes an invitation to play it again.
 */

/** Above the first, the reading was clean; above the second, it passed. Below, it is replayed. */
const HANDSOME = 90;
const GOOD = 75;

export function verdictLine(accuracy: number): string {
  if (accuracy >= HANDSOME) {
    return 'Très belle lecture.';
  }

  return accuracy >= GOOD ? 'Bon travail.' : 'On la reprend.';
}

/**
 * What was played: the study, or the fact that it was not one.
 *
 * Named by its marking rather than by the notes it brings. The parcours lists
 * the studies and says what is in each; a report is read after the session, when
 * what was in it has just been played — and the one thing it is worth saying is
 * which study the figures below belong to.
 */
export function playedLine(clef: Clef, level: Level, review: boolean): string {
  return review ? 'Révision ciblée' : studyMark(clef, level);
}

/** `Étude 3 · Andante` — a study said the short way, by its number and its marking. */
function studyMark(clef: Clef, level: Level): string {
  return `Étude ${level} · ${tempoOf(clef, level)}`;
}

/**
 * How long a missed note's bar is drawn, as a share of its track.
 *
 * Three mistakes fill it. The bar answers "how badly", not "how badly compared
 * to the others" — scaled against the worst of the session, one mistake on a
 * clean reading would draw a full bar and read as a disaster.
 */
const FILLS_AT = 3;

export function missShare(times: number): number {
  return Math.min(times / FILLS_AT, 1);
}

/** `3 erreurs`, and `1 erreur` — a learner who missed a note once reads the singular. */
export function missLine(times: number): string {
  return times === 1 ? '1 erreur' : `${times} erreurs`;
}

/** The study a session opened, named — or the next session, when it opened none. */
export function nextLine(clef: Clef, opened: Level | undefined): string {
  return opened === undefined ? 'Séance suivante' : studyMark(clef, opened);
}

export const RIGHT_NOTES = 'Notes justes';
export const ON_TIME = 'À temps';
export const TO_REVIEW = 'À revoir';
export const NO_MISTAKE = 'Aucune erreur';
export const OPENED = 'Nouvelle étude';
export const REPLAY = 'Rejouer';
export const BACK = 'Parcours';
