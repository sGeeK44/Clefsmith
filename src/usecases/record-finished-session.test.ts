import { describe, expect, it } from 'bun:test';
import { storeHolding } from '#test/progress-store';
import type { SessionResult } from '@/domain/training/progress';
import { createRecordFinishedSession } from '@/usecases/record-finished-session';

const read: SessionResult = {
  clef: 'treble',
  level: 1,
  review: false,
  answers: [{ degree: 'c', correct: true }],
};

describe('record finished session', () => {
  it('counts one more than the store holds', async () => {
    const store = storeHolding();
    const recordFinishedSession = createRecordFinishedSession(store);

    await recordFinishedSession(read);
    await recordFinishedSession(read);

    expect((await store.load()).sessions).toBe(2);
  });

  it('hands the result to the rules rather than applying its own', async () => {
    const store = storeHolding();

    await createRecordFinishedSession(store)({ ...read, review: true });

    expect((await store.load()).level.treble).toBe(1);
  });

  it('says what the session was worth, read against the record it was played on', async () => {
    const store = storeHolding();

    const report = await createRecordFinishedSession(store)(read);

    expect(report.opened).toBe(2);
  });

  it('writes the mastery the session earned', async () => {
    const store = storeHolding();

    await createRecordFinishedSession(store)(read);

    expect((await store.load()).mastery.treble).toEqual({ c: 2 });
  });
});
