import type { Settings } from '@/domain/settings';
import type { KeyValueStore } from '@/infrastructure/key-value-store';
import { decode, encode } from '@/infrastructure/settings-codec';
import type { SettingsStore } from '@/usecases/get-settings';

const KEY = 'settings';

export function createSettingsStore(storage: KeyValueStore): SettingsStore {
  return {
    load: async () => decode(await storage.getItemAsync(KEY)),
    save: (settings: Settings) => storage.setItemAsync(KEY, encode(settings)),
  };
}
