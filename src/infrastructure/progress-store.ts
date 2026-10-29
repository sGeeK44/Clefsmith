import type { Progress } from '@/domain/training/progress';
import type { KeyValueStore } from '@/infrastructure/key-value-store';
import { decode, encode } from '@/infrastructure/progress-codec';
import type { ProgressStore } from '@/usecases/get-progress';

const KEY = 'progress';

export function createProgressStore(storage: KeyValueStore): ProgressStore {
  return {
    load: async () => decode(await storage.getItemAsync(KEY)),
    save: (progress: Progress) => storage.setItemAsync(KEY, encode(progress)),
  };
}
