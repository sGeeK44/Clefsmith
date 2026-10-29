import type { Notation } from '@/domain/notation/naming';
import type { SettingsStore } from '@/usecases/get-settings';

export type ChooseNotation = (notation: Notation) => Promise<void>;

/** Reads the record before writing it back, so that what is written is whole. */
export function createChooseNotation(store: SettingsStore): ChooseNotation {
  return async (notation) => {
    await store.save({ ...(await store.load()), notation });
  };
}
