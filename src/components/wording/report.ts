import { studyLine, tempoOf } from '@/components/wording/study';
import type { Clef } from '@/domain/notation/clef';
import type { Notation } from '@/domain/notation/naming';
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

/** What was played: the study, or the fact that it was not one. */
export function playedLine(clef: Clef, level: Level, review: boolean, notation: Notation): string {
  return review ? 'Révision ciblée' : studyLine(clef, level, notation);
}

/** `3 erreurs`, and `1 erreur` — a learner who missed a note once reads the singular. */
export function missLine(times: number): string {
  return times === 1 ? '1 erreur' : `${times} erreurs`;
}

/** The study a session opened, named — or the next session, when it opened none. */
export function nextLine(opened: Level | undefined): string {
  return opened === undefined ? 'Séance suivante' : `Étude ${opened} · ${tempoOf(opened)}`;
}

export const RIGHT_NOTES = 'Notes justes';
export const ON_TIME = 'À temps';
export const TO_REVIEW = 'À revoir';
export const NO_MISTAKE = 'Aucune erreur';
export const OPENED = 'Nouvelle étude';
export const REPLAY = 'Rejouer';
export const BACK = 'Parcours';
