import type { Random } from '@/core/random';
import type { Clef } from '@/domain/notation/clef';
import type { Degree, Pitch } from '@/domain/notation/pitch';
import { type Level, newcomersOf, poolOf } from '@/domain/training/level';
import { sessionOf } from '@/domain/training/session';
import { exercisesIn, type Measures } from '@/domain/training/session-settings';

/** What a session is asked for: a study, a length, and whether it is a revision. */
interface Brief {
  readonly clef: Clef;
  readonly level: Level;
  readonly measures: Measures;
  /** A revision aims at these degrees alone. Empty means the whole study. */
  readonly degrees: readonly Degree[];
}

export type DrawSession = (brief: Brief) => readonly Pitch[];

/**
 * The notes of one session, drawn from the study the learner asked for.
 *
 * A revision narrows the pool to the degrees it aims at and **brings nothing**:
 * the bias towards new notes exists to practise what a level adds, and a revision
 * adds nothing — it goes back over what is already there.
 */
export function createDrawSession(random: Random): DrawSession {
  return ({ clef, level, measures, degrees }) => {
    const pool = poolOf(clef, level);
    const revision = degrees.length > 0;
    const drawn = revision ? pool.filter((pitch) => degrees.includes(pitch.degree)) : pool;

    return sessionOf(
      drawn,
      revision ? [] : newcomersOf(clef, level),
      exercisesIn(measures),
      random,
    );
  };
}
