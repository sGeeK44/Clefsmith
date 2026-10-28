import type { Clef } from '@/domain/notation/clef';
import type { Level } from '@/domain/training/level';
import { answered } from '@/domain/training/progress';
import type { ProgressStore } from '@/usecases/get-progress';

export type RecordAnswer = (clef: Clef, level: Level, correct: boolean) => Promise<void>;

/**
 * Remembers how one exercise went.
 *
 * It takes the verdict rather than working it out: comparing what the learner
 * said to what was on the staff belongs to the mode that listens.
 */
export function createRecordAnswer(store: ProgressStore): RecordAnswer {
  return async (clef, level, correct) => {
    await store.save(answered(await store.load(), clef, level, correct));
  };
}
