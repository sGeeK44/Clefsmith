import { describe, expect, it } from 'bun:test';
import { storeHolding } from '#test/progress-store';
import { noProgress, sessionFinished } from '@/domain/training/progress';
import { createGetProgress } from '@/usecases/get-progress';

describe('get progress', () => {
  it('answers with the record its store holds', async () => {
    const kept = sessionFinished(noProgress(), {
      clef: 'treble',
      level: 1,
      review: false,
      answers: [{ degree: 'c', correct: true }],
    });

    expect(await createGetProgress(storeHolding(kept))()).toEqual(kept);
  });

  it('writes nothing', async () => {
    const store = storeHolding();

    await createGetProgress(store)();

    expect(store.written).toEqual([]);
  });
});
