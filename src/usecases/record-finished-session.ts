import type { SessionResult } from '@/domain/training/progress';
import { sessionFinished } from '@/domain/training/progress';
import { type Report, reportOf } from '@/domain/training/report';
import type { ProgressStore } from '@/usecases/get-progress';

export type RecordFinishedSession = (result: SessionResult) => Promise<Report>;

/**
 * Writing a session down and saying what it was worth are the same read.
 *
 * The report is worked out from the record the session was played against, so it
 * has to be read before the new one is written. Handing it back here is what
 * keeps the screen from loading the progression a second time and reporting on
 * whichever of the two reads won.
 */
export function createRecordFinishedSession(store: ProgressStore): RecordFinishedSession {
  return async (result) => {
    const before = await store.load();

    await store.save(sessionFinished(before, result));

    return reportOf(before, result);
  };
}
