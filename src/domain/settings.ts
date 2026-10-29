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
  /**
   * Whether the introduction has been seen — played through or passed over.
   *
   * It sits here rather than with the progression because the progression is
   * erasable and this is not: starting the practice over must not hand the
   * learner the introduction again.
   */
  readonly welcomed: boolean;
}

/** What a learner who has chosen nothing reads in. */
export function defaultSettings(): Settings {
  return { notation: 'syllabic', welcomed: false };
}
