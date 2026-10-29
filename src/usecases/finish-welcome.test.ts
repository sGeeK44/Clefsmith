import { describe, expect, it } from 'bun:test';
import { storeHolding } from '#test/progress-store';
import { settingsHolding } from '#test/settings-store';
import { noProgress } from '@/domain/training/progress';
import { createFinishWelcome } from '@/usecases/finish-welcome';

describe('finishing the introduction', () => {
  it('marks the learner welcomed, and keeps what they had chosen', async () => {
    const settings = settingsHolding({ notation: 'letters', welcomed: false });

    await createFinishWelcome(storeHolding(), settings)(1);

    expect(await settings.load()).toEqual({ notation: 'letters', welcomed: true });
  });

  it('opens the study the learner said they were starting from, in the treble', async () => {
    const progress = storeHolding();

    await createFinishWelcome(progress, settingsHolding())(5);

    expect((await progress.load()).level).toEqual({ treble: 5, bass: 1 });
  });

  it('opens nothing when the introduction was passed over, but marks it seen', async () => {
    const progress = storeHolding();
    const settings = settingsHolding();

    await createFinishWelcome(progress, settings)();

    expect(progress.written).toEqual([]);
    expect(await settings.load()).toEqual({ notation: 'syllabic', welcomed: true });
  });

  it('never takes back a study already opened, so replaying it resets nothing', async () => {
    const progress = storeHolding({ ...noProgress(), level: { treble: 5, bass: 3 } });

    await createFinishWelcome(progress, settingsHolding())(1);

    expect((await progress.load()).level).toEqual({ treble: 5, bass: 3 });
  });
});
