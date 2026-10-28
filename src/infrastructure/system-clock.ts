import type { Clock } from '@/core/clock';

export const systemClock: Clock = {
  now: () => Date.now(),
  /**
   * `setTimeout` is allowed to fire early — the delay it is given is rounded to the
   * platform's timer resolution — so one wait is not enough to honour the port's
   * promise to resolve *at* the instant. It is waited out again until it has passed.
   */
  sleepUntil: async (instant) => {
    while (Date.now() < instant) {
      await new Promise((resolve) => setTimeout(resolve, instant - Date.now()));
    }
  },
};
