import type { KeyValueStore } from '@/infrastructure/key-value-store';

export interface RecordingKeyValueStore extends KeyValueStore {
  /** Every key written, with the last value written to it. */
  readonly written: Record<string, string>;
}

/**
 * A key-value store in memory, which remembers what was written.
 *
 * It honours the port: a key never written answers with `null`, not `undefined`.
 * Entries handed in stand for what a previous launch left behind.
 */
export function storageHolding(entries: Record<string, string> = {}): RecordingKeyValueStore {
  const written: Record<string, string> = { ...entries };

  return {
    written,
    getItemAsync: async (key) => written[key] ?? null,
    setItemAsync: async (key, value) => {
      written[key] = value;
    },
  };
}
