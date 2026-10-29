import type { Notation } from '@/domain/notation/naming';

/**
 * What the learner has chosen for themselves.
 *
 * Kept apart from the record of what they have learnt: starting the progression
 * over must not start the vocabulary over with it. They are two records, and
 * this is the one nothing but the learner changes.
 */
export interface Settings {
  readonly notation: Notation;
}

/** What a learner who has chosen nothing reads in. */
export function defaultSettings(): Settings {
  return { notation: 'syllabic' };
}
