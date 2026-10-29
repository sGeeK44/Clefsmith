/**
 * The slice of a key-value store the adapters need: one string, read and written.
 *
 * Declaring it here rather than importing the SDK's class is what keeps every
 * store runnable outside a device — the adapter that holds the real store is one
 * line long, and the stores written against this are the part worth testing.
 */
export interface KeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}
