import type { SessionResult } from '@/domain/training/progress';
import { sessionFinished } from '@/domain/training/progress';
import type { ProgressStore } from '@/usecases/get-progress';

export type RecordFinishedSession = (result: SessionResult) => Promise<void>;

export function createRecordFinishedSession(store: ProgressStore): RecordFinishedSession {
  return async (result) => {
    await store.save(sessionFinished(await store.load(), result));
  };
}
