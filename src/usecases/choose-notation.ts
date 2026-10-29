import type { Notation } from '@/domain/notation/naming';
import type { SettingsStore } from '@/usecases/get-settings';

export type ChooseNotation = (notation: Notation) => Promise<void>;

/**
 * Reads the record before writing it back, so that what is written is whole.
 *
 * There is one choice today, so no test can tell this apart from writing the one
 * field — and that is the point: the day a second choice is added, a write that
 * carried only the notation would drop it without anyone noticing.
 */
export function createChooseNotation(store: SettingsStore): ChooseNotation {
  return async (notation) => {
    await store.save({ ...(await store.load()), notation });
  };
}
