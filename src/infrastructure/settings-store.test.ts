import { describe, expect, it } from 'bun:test';
import { storageHolding } from '#test/key-value-store';
import { defaultSettings } from '@/domain/settings';
import { encode } from '@/infrastructure/settings-codec';
import { createSettingsStore } from '@/infrastructure/settings-store';

describe('the settings store', () => {
  it('reads back what it wrote', async () => {
    const store = createSettingsStore(storageHolding());

    await store.save({ notation: 'letters' });

    expect(await store.load()).toEqual({ notation: 'letters' });
  });

  it('answers with the default when the key was never written', async () => {
    expect(await createSettingsStore(storageHolding()).load()).toEqual(defaultSettings());
  });

  it('writes the record down rather than the object it was handed', async () => {
    const storage = storageHolding();

    await createSettingsStore(storage).save({ notation: 'letters' });

    expect(storage.written.settings).toBe(encode({ notation: 'letters' }));
  });

  it('touches no key but its own, the progression included', async () => {
    const storage = storageHolding({ progress: 'untouched' });

    await createSettingsStore(storage).save({ notation: 'letters' });

    expect(storage.written.progress).toBe('untouched');
    expect(Object.keys(storage.written).sort()).toEqual(['progress', 'settings']);
  });
});
