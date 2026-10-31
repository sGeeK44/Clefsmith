import { type Clef, staffPosition } from '@/domain/notation/clef';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Pitch } from '@/domain/notation/pitch';
import { LEVELS, type Level, newcomersOf, poolOf } from '@/domain/training/level';
import type { Reach } from '@/domain/training/progress';

/**
 * What a level is called on screen, which is not the same word in both clefs.
 *
 * The domain says level and counts from one. The learner reads _étude_, and each
 * one is named after an Italian marking — `docs/training.md` settles that the
 * translation is the screen's business, and this is where the screens do it.
 *
 * The treble climbs through tempo markings and the bass through dynamics. Both
 * ladders are ordered, not decorative, and the two differ so that a learner who
 * works both clefs can tell at a glance which parcours they are looking at —
 * « Andante » and « Mezzo-piano » are the same rung of two different climbs.
 */
const MARKINGS: Record<Clef, Record<Level, string>> = {
  treble: { 1: 'Largo', 2: 'Adagio', 3: 'Andante', 4: 'Moderato', 5: 'Allegro', 6: 'Presto' },
  bass: {
    1: 'Pianissimo',
    2: 'Piano',
    3: 'Mezzo-piano',
    4: 'Mezzo-forte',
    5: 'Forte',
    6: 'Fortissimo',
  },
};

export function tempoOf(clef: Clef, level: Level): string {
  return MARKINGS[clef][level];
}

/** How many levels there are to climb, which a screen shows as `n / 6`. */
export const STUDIES = LEVELS.length;

/**
 * `Étude 4 · Do, Ré`, or just `Étude 6` at the level that brings nothing.
 *
 * The notes are the ones the study adds **in its clef**: the two clefs climb
 * their own pool, so the same study number names different notes in each.
 *
 * They are named through the learner's own notation, and capitalised the way a
 * list of names is written rather than the way a note is answered out loud.
 */
export function studyLine(clef: Clef, level: Level, notation: Notation): string {
  return `Étude ${level} · ${broughtInWords(clef, level, notation)}`;
}

/** Notes this high are off the staff, and a learner meets them as leger lines first. */
const ABOVE = 8;
const BELOW = 0;

/**
 * What a study adds, said the way a teacher would say it.
 *
 * Four cases, and the level table decides which one — nothing here lists a
 * level by number, so adding one to `POSITIONS` names itself:
 *
 * - it adds nothing: the same staff read faster;
 * - it is the first, which introduces the staff rather than extending it;
 * - it reaches off the staff: leger lines, which is the skill, not the notes;
 * - it adds degrees the learner already reads an octave down: the high ones;
 * - otherwise: the notes, named.
 */
function broughtInWords(clef: Clef, level: Level, notation: Notation): string {
  const brought = newcomersOf(clef, level);
  const names = brought.map(({ degree }) => capitalised(nameOf(degree, notation)));

  if (brought.length === 0) {
    return 'Toute la portée, plus vite';
  }

  /**
   * The first study has nothing to extend: it introduces the staff, leger line
   * and all, and what it is about is the three notes on it.
   */
  if (level === 1) {
    return names.join(', ');
  }

  if (brought.some((pitch) => offTheStaff(clef, pitch))) {
    return 'Lignes supplémentaires';
  }

  const known = poolOf(clef, (level - 1) as Level).map(({ degree }) => degree);

  return brought.every(({ degree }) => known.includes(degree))
    ? `${names.join(' et ')} aigus`
    : names.join(', ');
}

function offTheStaff(clef: Clef, pitch: Pitch): boolean {
  const position = staffPosition(clef, pitch);

  return position < BELOW || position > ABOVE;
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
