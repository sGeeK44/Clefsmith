import type { Clef } from '@/domain/notation/clef';
import { DEGREES, type Degree } from '@/domain/notation/pitch';
import type { Level } from '@/domain/training/level';
import {
  type Answer,
  accuracyOf,
  type Progress,
  type SessionResult,
  sessionFinished,
} from '@/domain/training/progress';

/** How many notes a learner is sent back over. More than a handful is not a list, it is the session. */
const NAMED = 3;

/** A degree the learner got wrong, and how many times. */
interface Miss {
  readonly degree: Degree;
  readonly times: number;
}

/** What a finished session is worth, read off it once and shown as it is. */
export interface Report {
  readonly clef: Clef;
  readonly level: Level;
  readonly review: boolean;
  readonly accuracy: number;
  /** At most three, most missed first. Empty when the session was read clean. */
  readonly missed: readonly Miss[];
  /** The level the session opened, if it opened one. */
  readonly opened: Level | undefined;
}

/**
 * The report of a finished session, worked out from the record it was played
 * against rather than from the record it left behind.
 *
 * Whether a level opened is **not** a fact of its own: it is the progression rule
 * replayed and compared. A second rule saying when a level opens would diverge
 * from the first one on the day either moves.
 */
export function reportOf(before: Progress, result: SessionResult): Report {
  const { clef, level, review, answers } = result;
  const after = sessionFinished(before, result);

  return {
    clef,
    level,
    review,
    accuracy: accuracyOf(answers),
    missed: missesOf(answers),
    opened: after.level[clef] > before.level[clef] ? after.level[clef] : undefined,
  };
}

/**
 * The degrees got wrong, most missed first, at most three.
 *
 * Ties are broken by the order the degrees climb an octave — the same rule as the
 * weakest degrees, and for the same reason: two notes missed as often have no
 * order of their own, and the octave is one the learner already reads in.
 */
function missesOf(answers: readonly Answer[]): readonly Miss[] {
  return DEGREES.map((degree) => ({
    degree,
    times: answers.filter((answer) => answer.degree === degree && !answer.correct).length,
  }))
    .filter((miss) => miss.times > 0)
    .sort((one, other) => other.times - one.times)
    .slice(0, NAMED);
}
