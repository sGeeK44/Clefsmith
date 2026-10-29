import { LEVELS, type Level } from '@/domain/training/level';

/**
 * What a level is called on screen.
 *
 * The domain says level and counts from one. The learner reads _étude_, and each
 * one is named after a tempo marking — `docs/training.md` settles that the
 * translation is the screen's business, and this is where the screens do it.
 *
 * The names are ordered, not decorative: they are the six levels read faster and
 * faster, which is what level 6 is for.
 */
const TEMPI: Record<Level, string> = {
  1: 'Largo',
  2: 'Adagio',
  3: 'Andante',
  4: 'Moderato',
  5: 'Allegro',
  6: 'Presto',
};

export function tempoOf(level: Level): string {
  return TEMPI[level];
}

/** How many levels there are to climb, which a screen shows as `n / 6`. */
export const STUDIES = LEVELS.length;
