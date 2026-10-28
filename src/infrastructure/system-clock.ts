import type { Clock } from '@/core/clock';

export const systemClock: Clock = {
  now: () => Date.now(),
  sleepUntil: (instant) =>
    new Promise((resolve) => {
      setTimeout(resolve, instant - Date.now());
    }),
};
