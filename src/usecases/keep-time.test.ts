import { describe, expect, it } from 'bun:test';
import { createKeepTime } from '@/usecases/keep-time';

/**
 * A clock that moves only when the test says so, and one beat at a time, so
 * that what is asserted is the instant asked for rather than how busy the
 * machine running the suite happens to be.
 */
function clockOnDemand() {
  const waiting: { instant: number; wake: () => void }[] = [];
  let current = 0;

  return {
    asked: [] as number[],
    now: () => current,
    sleepUntil(instant: number) {
      this.asked.push(instant);

      return new Promise<void>((wake) => {
        waiting.push({ instant, wake });
      });
    },
    /** Lets time reach the next instant something is waiting for. */
    async pass() {
      const next = waiting.shift();

      if (next === undefined) {
        throw new Error('nothing is waiting');
      }

      current = next.instant;
      next.wake();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

describe('keeping time', () => {
  it('beats once a second at sixty to the minute', async () => {
    const clock = clockOnDemand();
    const beats: number[] = [];

    createKeepTime(clock)(60, () => beats.push(clock.now()));
    await clock.pass();
    await clock.pass();

    expect(beats).toEqual([1000, 2000]);
  });

  it('beats four times as often at a hundred and sixty', async () => {
    const clock = clockOnDemand();

    createKeepTime(clock)(160, () => undefined);
    await clock.pass();

    expect(clock.asked[0]).toBe(375);
  });

  it('waits for each beat from the start, so a slow beat does not push the next one', async () => {
    const clock = clockOnDemand();

    createKeepTime(clock)(60, () => undefined);
    await clock.pass();
    await clock.pass();
    await clock.pass();

    expect(clock.asked.slice(0, 3)).toEqual([1000, 2000, 3000]);
  });

  it('beats no more once it has been stopped', async () => {
    const clock = clockOnDemand();
    const beats: number[] = [];

    const stop = createKeepTime(clock)(60, () => beats.push(clock.now()));
    await clock.pass();
    stop();
    await clock.pass();

    expect(beats).toEqual([1000]);
  });
});
