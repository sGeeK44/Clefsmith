import { noProgress } from '@/domain/training/progress';
import type { ProgressStore } from '@/usecases/get-progress';

export type ResetProgress = () => Promise<void>;

/**
 * Puts the learner back to their first day, and leaves their choices alone.
 *
 * It writes the record of a learner who has never played rather than removing
 * the key. The two read back the same, and writing is the one of them that is
 * atomic: an application killed halfway through a removal is a question nobody
 * should have to answer.
 */
export function createResetProgress(store: ProgressStore): ResetProgress {
  return () => store.save(noProgress());
}
