import { describe, expect, it } from 'bun:test';
import { storeHolding } from '#test/progress-store';
import { noProgress } from '@/domain/training/progress';
import { createResetProgress } from '@/usecases/reset-progress';

describe('resetting the progression', () => {
  it('puts the learner back to their first day', async () => {
    const store = storeHolding({
      sessions: 12,
      level: { treble: 5, bass: 3 },
      mastery: { treble: { c: 40 }, bass: { g: 80 } },
    });

    await createResetProgress(store)();

    expect(await store.load()).toEqual(noProgress());
  });

  it('writes a record rather than leaving the store with nothing to read', async () => {
    const store = storeHolding();

    await createResetProgress(store)();

    expect(store.written).toEqual([noProgress()]);
  });
});
