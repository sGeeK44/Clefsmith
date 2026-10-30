import type { Clef } from '@/domain/notation/clef';
import { type Notation, nameOf } from '@/domain/notation/naming';
import { LEVELS, type Level, newcomersOf } from '@/domain/training/level';
import type { Reach } from '@/domain/training/progress';

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

/**
 * `Étude 4 · Do, Ré`, or just `Étude 6` at the level that brings nothing.
 *
 * The notes are named through the learner's own notation, and capitalised the way
 * a list of names is written rather than the way a note is answered out loud.
 */
export function studyLine(level: Level, notation: Notation): string {
  const study = `Étude ${level}`;
  const brought = newcomersOf('treble', level).map(({ degree }) =>
    capitalised(nameOf(degree, notation)),
  );

  return brought.length === 0 ? study : `${study} · ${brought.join(', ')}`;
}

function capitalised(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** What the clef selector calls each clef. */
const CLEFS: Record<Clef, string> = { treble: 'Clé de sol', bass: 'Clé de fa' };

export function clefName(clef: Clef): string {
  return CLEFS[clef];
}

/**
 * What a study adds, counted — or `Révision` when it adds nothing.
 *
 * The last study brings no note of its own: it is the same staff read faster, so
 * what it offers is a review rather than a number. No study brings exactly one,
 * in either clef, so there is no singular to write.
 */
export function broughtLine(clef: Clef, level: Level): string {
  const brought = newcomersOf(clef, level).length;

  return brought === 0 ? 'Révision' : `${brought} nouvelles notes`;
}

/**
 * Where a study stands for the learner, said beside its node on the parcours.
 *
 * A finished study says so rather than showing what it was read at: nothing
 * records a study's score — only the mastery per note survives a session — and
 * a figure the record cannot produce is a figure that would have to be invented.
 */
export function reachLine(reach: Reach): string {
  return REACHES[reach];
}

const REACHES: Record<Reach, string> = {
  done: 'Terminé',
  current: 'En cours',
  ahead: 'À venir',
};

/** What a node carries: a tick once the study is behind the learner, its number before. */
export function nodeLabel(reach: Reach, level: Level): string {
  return reach === 'done' ? '✓' : `${level}`;
}
