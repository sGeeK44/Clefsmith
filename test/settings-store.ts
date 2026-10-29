import { defaultSettings, type Settings } from '@/domain/settings';
import type { SettingsStore } from '@/usecases/get-settings';

export interface RecordingSettingsStore extends SettingsStore {
  /** Every record handed to `save`, in order. */
  readonly written: readonly Settings[];
}

/**
 * A store that keeps the choices in memory and remembers every write.
 *
 * It honours the port: `load` answers with the last record written, and with the
 * default when nothing has been written yet — the port promises a record, never
 * the absence of one.
 */
export function settingsHolding(settings: Settings = defaultSettings()): RecordingSettingsStore {
  const written: Settings[] = [];
  let held = settings;

  return {
    written,
    load: async () => held,
    save: async (saved) => {
      written.push(saved);
      held = saved;
    },
  };
}
