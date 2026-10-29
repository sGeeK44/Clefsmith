import type { Settings } from '@/domain/settings';

/**
 * Where a learner's choices are kept between two launches.
 *
 * The port speaks the domain, not a storage format: how a choice is written down
 * — and what to do with one that cannot be read back — belongs to the adapter.
 */
export interface SettingsStore {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}

export type GetSettings = () => Promise<Settings>;

export function createGetSettings(store: SettingsStore): GetSettings {
  return () => store.load();
}
