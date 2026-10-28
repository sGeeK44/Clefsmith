import type { Progress } from '@/domain/training/progress';

/**
 * Where a learner's record is kept between two launches.
 *
 * The port speaks the domain, not a storage format: how a record is written down
 * — and what to do with one that cannot be read back — belongs to the adapter.
 */
export interface ProgressStore {
  load(): Promise<Progress>;
  save(progress: Progress): Promise<void>;
}

export type GetProgress = () => Promise<Progress>;

export function createGetProgress(store: ProgressStore): GetProgress {
  return () => store.load();
}
