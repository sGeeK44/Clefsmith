import { describe, expect, it } from 'bun:test';
import { storageHolding } from '#test/key-value-store';
import { noProgress, sessionFinished } from '@/domain/training/progress';
import { encode } from '@/infrastructure/progress-codec';
import { createProgressStore } from '@/infrastructure/progress-store';

describe('the progress store', () => {
  it('reads back what it wrote', async () => {
    const store = createProgressStore(storageHolding());
    const played = sessionFinished(noProgress(), {
      clef: 'treble',
      level: 1,
      review: false,
      answers: [{ degree: 'c', correct: true }],
    });

    await store.save(played);

    expect(await store.load()).toEqual(played);
  });

  it('starts the learner over when the key was never written', async () => {
    expect(await createProgressStore(storageHolding()).load()).toEqual(noProgress());
  });

  it('starts the learner over when the key holds something else', async () => {
    const store = createProgressStore(storageHolding({ progress: 'not a record' }));

    expect(await store.load()).toEqual(noProgress());
  });

  it('writes the record down rather than the object it was handed', async () => {
    const storage = storageHolding();

    await createProgressStore(storage).save(noProgress());

    expect(storage.written.progress).toBe(encode(noProgress()));
  });

  it('touches no key but its own', async () => {
    const storage = storageHolding({ other: 'untouched' });

    await createProgressStore(storage).save(noProgress());

    expect(storage.written.other).toBe('untouched');
    expect(Object.keys(storage.written).sort()).toEqual(['other', 'progress']);
  });
});
