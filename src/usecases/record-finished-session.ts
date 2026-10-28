import { sessionFinished } from '@/domain/training/progress';
import type { ProgressStore } from '@/usecases/get-progress';

export type RecordFinishedSession = () => Promise<void>;

/** Counts one more session the learner played to the end. */
export function createRecordFinishedSession(store: ProgressStore): RecordFinishedSession {
  return async () => {
    await store.save(sessionFinished(await store.load()));
  };
}
