import type { Level } from '@/domain/training/level';
import { startedAt } from '@/domain/training/progress';
import type { ProgressStore } from '@/usecases/get-progress';
import type { SettingsStore } from '@/usecases/get-settings';

/** The end of the introduction, whether it was played through or passed over. */
export type FinishWelcome = (start?: Level) => Promise<void>;

/**
 * Marks the learner welcomed, and opens where they said they were starting from.
 *
 * The mark is written either way: an introduction that was passed over has still
 * been seen, and handing it back at the next launch is the one thing it must not
 * do. A starting level is written only when one was chosen — passing over opens
 * nothing.
 */
export function createFinishWelcome(
  progress: ProgressStore,
  settings: SettingsStore,
): FinishWelcome {
  return async (start) => {
    if (start !== undefined) {
      await progress.save(startedAt(await progress.load(), start));
    }

    await settings.save({ ...(await settings.load()), welcomed: true });
  };
}
