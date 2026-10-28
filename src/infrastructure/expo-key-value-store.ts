import { Storage } from 'expo-sqlite/kv-store';
import type { KeyValueStore } from '@/infrastructure/progress-store';

/**
 * The key-value store Expo ships on top of SQLite.
 *
 * SQLite rather than a file because a write is atomic: an app killed halfway
 * through one leaves the previous record, not half of the new one. And the
 * database lives in the app's document directory, which an over-the-air update
 * does not touch — it replaces the JavaScript bundle and nothing else.
 */
export const expoKeyValueStore: KeyValueStore = Storage;
