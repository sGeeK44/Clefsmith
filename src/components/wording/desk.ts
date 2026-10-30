import { STUDIES } from '@/components/wording/study';
import type { Level } from '@/domain/training/level';

/** What an exercise says about itself on the right of its line. */
export function badgeLine(open: boolean, level: Level | undefined): string {
  if (!open) {
    return 'Bientôt';
  }

  return level === undefined ? '' : `${level} / ${STUDIES}`;
}

/**
 * How much of the parcours is behind the learner.
 *
 * The study they are on is not behind them, so the first study shows an empty
 * bar rather than a sixth of one — and the sixth shows five sixths, because a
 * full bar on a study still to read would be a lie.
 *
 * An exercise with nothing behind it shows nothing, whatever the learner has
 * read elsewhere: its bar is about that exercise.
 */
export function progressOf(open: boolean, level: Level | undefined): number {
  if (!open || level === undefined) {
    return 0;
  }

  return (level - 1) / STUDIES;
}
