import type { Random } from '@/core/random';

/** The platform's chance. It is the one thing in here that cannot be replayed. */
export const mathRandom: Random = {
  next: () => Math.random(),
};
