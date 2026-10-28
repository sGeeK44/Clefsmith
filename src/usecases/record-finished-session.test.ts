import { describe, expect, it } from 'bun:test';
import { storeHolding } from '#test/progress-store';
import { createRecordFinishedSession } from '@/usecases/record-finished-session';

describe('record finished session', () => {
  it('counts one more than the store holds', async () => {
    const store = storeHolding();
    const recordFinishedSession = createRecordFinishedSession(store);

    await recordFinishedSession();
    await recordFinishedSession();

    expect((await store.load()).sessions).toBe(2);
  });

  it('leaves the answers alone', async () => {
    const store = storeHolding();

    await createRecordFinishedSession(store)();

    expect((await store.load()).answers.treble[1]).toEqual([]);
  });
});
