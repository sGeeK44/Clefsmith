import type { Clock } from '@/core/clock';

export interface VirtualClock extends Clock {
  advance(ms: number): void;
}

/**
 * Time the caller moves itself.
 *
 * A latency measured against the machine's own clock is a measurement, and two
 * measurements never agree to the millisecond. A fake track replayed on this
 * clock publishes the same figures every time, which is what makes the bench
 * checkable against itself — and what a real track can never be.
 */
export function virtualClock(): VirtualClock {
  let current = 0;

  return {
    now: () => current,
    sleepUntil: async (instant: number) => {
      current = Math.max(current, instant);
    },
    advance: (ms: number) => {
      current += ms;
    },
  };
}
