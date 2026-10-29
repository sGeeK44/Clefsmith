import { describe, expect, it } from 'bun:test';
import { settingsHolding } from '#test/settings-store';
import { createChooseNotation } from '@/usecases/choose-notation';

describe('choosing a notation', () => {
  it('writes the choice down', async () => {
    const store = settingsHolding();

    await createChooseNotation(store)('letters');

    expect(await store.load()).toEqual({ notation: 'letters', welcomed: false });
  });

  it('keeps the last choice, not the first', async () => {
    const store = settingsHolding();
    const choose = createChooseNotation(store);

    await choose('letters');
    await choose('syllabic');

    expect(store.written).toEqual([
      { notation: 'letters', welcomed: false },
      { notation: 'syllabic', welcomed: false },
    ]);
  });

  it('leaves the rest of the record alone', async () => {
    const store = settingsHolding({ notation: 'syllabic', welcomed: true });

    await createChooseNotation(store)('letters');

    expect(await store.load()).toEqual({ notation: 'letters', welcomed: true });
  });
});
