import { noProgress, type Progress } from '@/domain/training/progress';
import type { ProgressStore } from '@/usecases/get-progress';

export interface RecordingStore extends ProgressStore {
  /** Every record handed to `save`, in order. */
  readonly written: readonly Progress[];
}

/**
 * A store that keeps a record in memory and remembers every write.
 *
 * It honours the port: `load` answers with the last record written, and with the
 * record of a learner who has never played when nothing has been written yet —
 * the port promises a record, never the absence of one.
 */
export function storeHolding(progress: Progress = noProgress()): RecordingStore {
  const written: Progress[] = [];
  let held = progress;

  return {
    written,
    load: async () => held,
    save: async (saved) => {
      written.push(saved);
      held = saved;
    },
  };
}
