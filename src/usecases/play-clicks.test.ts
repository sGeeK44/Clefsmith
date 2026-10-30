import { describe, expect, it } from 'bun:test';
import { type ClickTrack, createPlayClicks } from '@/usecases/play-clicks';

/** How late a platform timer fires, in this test's milliseconds. */
const OVERSLEPT = 137;

/** A wall clock that moves only when the test says so, and oversleeps like a real one. */
function clockOnDemand() {
  const waiting: { instant: number; wake: () => void }[] = [];
  let current = 0;

  return {
    now: () => current,
    sleepUntil(instant: number) {
      return new Promise<void>((wake) => {
        waiting.push({ instant, wake });
      });
    },
    async pass() {
      const next = waiting.shift();

      if (next === undefined) {
        throw new Error('nothing is waiting');
      }

      current = next.instant + OVERSLEPT;
      next.wake();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

/**
 * An audio timeline the test moves by hand, so that what is asserted is the
 * instant a click was written at rather than when the suite happened to run.
 */
function trackFrom(origin: number) {
  let current = origin;
  const scheduled: number[] = [];
  let stopped = false;

  const track = {
    now: () => current,
    clickAt: (instant: number) => {
      scheduled.push(instant);
    },
    stop: () => {
      stopped = true;
    },
  } satisfies ClickTrack;

  return {
    ...track,
    scheduled,
    get stopped() {
      return stopped;
    },
    /** What playing a while does to the audio clock, independently of the wall clock. */
    play(ms: number) {
      current += ms;
    },
  };
}

describe('clicking the beat', () => {
  it('clicks once a second at sixty to the minute', () => {
    const track = trackFrom(0);

    createPlayClicks(() => track, clockOnDemand())(60);

    expect(track.scheduled).toEqual([0]);
  });

  it('clicks four times as often at a hundred and sixty', () => {
    const track = trackFrom(0);

    createPlayClicks(() => track, clockOnDemand())(160);

    expect(track.scheduled).toEqual([0, 375]);
  });

  it('writes a click down before it is due, rather than when it sounds', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    createPlayClicks(() => track, clock)(60);
    track.play(600);
    await clock.pass();

    expect([track.scheduled.at(-1), track.now()]).toEqual([1000, 600]);
  });

  it('keeps the grid when the refill is woken up late', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    createPlayClicks(() => track, clock)(60);
    track.play(1000);
    await clock.pass();

    expect(track.scheduled).toEqual([0, 1000]);
  });

  it('runs on the audio clock, not on the wall clock', () => {
    const track = trackFrom(8000);

    createPlayClicks(() => track, clockOnDemand())(60);

    expect(track.scheduled).toEqual([8000]);
  });

  it('holds the grid over a session rather than drifting with each refill', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    createPlayClicks(() => track, clock)(60);

    for (const _ of Array.from({ length: 64 })) {
      track.play(250);
      await clock.pass();
    }

    expect(track.scheduled.at(-1)).toBe(track.scheduled.length * 1000 - 1000);
  });

  it('closes the track when it is stopped, and writes nothing more', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    const stop = createPlayClicks(() => track, clock)(60);
    stop();
    track.play(1000);
    await clock.pass();

    expect([track.stopped, track.scheduled]).toEqual([true, [0]]);
  });
});
