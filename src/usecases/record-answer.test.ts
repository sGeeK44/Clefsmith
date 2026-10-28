import { describe, expect, it } from 'bun:test';
import { storeHolding } from '#test/progress-store';
import { createRecordAnswer } from '@/usecases/record-answer';

describe('record answer', () => {
  it('keeps the answer against the clef and the level it was given for', async () => {
    const store = storeHolding();

    await createRecordAnswer(store)('bass', 4, true);

    expect((await store.load()).answers.bass[4]).toEqual([true]);
  });

  it('adds to what the store already holds rather than starting over', async () => {
    const store = storeHolding();
    const recordAnswer = createRecordAnswer(store);

    await recordAnswer('treble', 1, true);
    await recordAnswer('treble', 1, false);

    expect((await store.load()).answers.treble[1]).toEqual([true, false]);
  });

  it('writes once per answer', async () => {
    const store = storeHolding();

    await createRecordAnswer(store)('treble', 1, true);

    expect(store.written).toHaveLength(1);
  });
});
