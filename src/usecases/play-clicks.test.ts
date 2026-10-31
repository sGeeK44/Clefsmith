import { describe, expect, it } from 'bun:test';
import { type ClickTrack, createPlayClicks } from '@/usecases/play-clicks';

/** Lets everything already waiting on a resolved promise run before asserting. */
const settle = () => new Promise<void>((done) => setTimeout(done, 0));

/** A track that is already open: the ordinary case, where opening waits for nothing. */
const openAs = (track: ClickTrack) => () => Promise.resolve(track);

/**
 * A track handed over only when the test says so, so that what a session does
 * *while* its hardware is still opening can be asserted at all.
 */
function openingOnDemand(track: ClickTrack) {
  let handOver = () => {};
  const waited = new Promise<void>((resolve) => {
    handOver = resolve;
  });

  return {
    open: () => waited.then(() => track),
    async hand() {
      handOver();
      await settle();
    },
  };
}

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
  it('clicks once a second at sixty to the minute', async () => {
    const track = trackFrom(0);

    createPlayClicks(openAs(track), clockOnDemand())(60);
    await settle();

    expect(track.scheduled).toEqual([0]);
  });

  it('clicks four times as often at a hundred and sixty', async () => {
    const track = trackFrom(0);

    createPlayClicks(openAs(track), clockOnDemand())(160);
    await settle();

    expect(track.scheduled).toEqual([0, 375]);
  });

  it('writes a click down before it is due, rather than when it sounds', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    createPlayClicks(openAs(track), clock)(60);
    await settle();
    track.play(600);
    await clock.pass();

    expect([track.scheduled.at(-1), track.now()]).toEqual([1000, 600]);
  });

  it('keeps the grid when the refill is woken up late', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    createPlayClicks(openAs(track), clock)(60);
    await settle();
    track.play(1000);
    await clock.pass();

    expect(track.scheduled).toEqual([0, 1000]);
  });

  it('runs on the audio clock, not on the wall clock', async () => {
    const track = trackFrom(8000);

    createPlayClicks(openAs(track), clockOnDemand())(60);
    await settle();

    expect(track.scheduled).toEqual([8000]);
  });

  it('holds the grid over a session rather than drifting with each refill', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    createPlayClicks(openAs(track), clock)(60);
    await settle();

    for (const _ of Array.from({ length: 64 })) {
      track.play(250);
      await clock.pass();
    }

    expect(track.scheduled.at(-1)).toBe(track.scheduled.length * 1000 - 1000);
  });

  it('closes the track when it is stopped, and writes nothing more', async () => {
    const track = trackFrom(0);
    const clock = clockOnDemand();

    const stop = createPlayClicks(openAs(track), clock)(60);
    await settle();
    stop();
    track.play(1000);
    await clock.pass();

    expect([track.stopped, track.scheduled]).toEqual([true, [0]]);
  });

  it('writes nothing while the track is still opening', async () => {
    const track = trackFrom(0);
    const opening = openingOnDemand(track);

    createPlayClicks(opening.open, clockOnDemand())(60);
    await settle();

    expect(track.scheduled).toEqual([]);
  });

  it('starts the grid where the track opened, not where it was asked for', async () => {
    const track = trackFrom(0);
    const opening = openingOnDemand(track);

    createPlayClicks(opening.open, clockOnDemand())(60);
    track.play(400);
    await opening.hand();

    expect(track.scheduled).toEqual([400]);
  });

  it('closes a track that opens after the session was stopped', async () => {
    const track = trackFrom(0);
    const opening = openingOnDemand(track);

    createPlayClicks(opening.open, clockOnDemand())(60)();
    await opening.hand();

    expect([track.stopped, track.scheduled]).toEqual([true, []]);
  });
});
