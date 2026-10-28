import type { Progress } from '@/domain/training/progress';
import { decode, encode } from '@/infrastructure/progress-codec';
import type { ProgressStore } from '@/usecases/get-progress';

/**
 * The slice of a key-value store this needs: one string, read and written.
 *
 * Declaring it here rather than importing the SDK's class is what keeps this file
 * runnable outside a device — the adapter that holds the real store is one line
 * long, and this is the part worth testing.
 */
export interface KeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

const KEY = 'progress';

export function createProgressStore(storage: KeyValueStore): ProgressStore {
  return {
    load: async () => decode(await storage.getItemAsync(KEY)),
    save: (progress: Progress) => storage.setItemAsync(KEY, encode(progress)),
  };
}
