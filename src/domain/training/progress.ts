import type { Clef } from '@/domain/notation/clef';
import type { Degree } from '@/domain/notation/pitch';
import { LEVELS, type Level } from '@/domain/training/level';

/** The share of a session that has to be right for the next level to open. */
const PASS_MARK = 75;

export interface Progress {
  readonly sessions: number;
  readonly level: Readonly<Record<Clef, Level>>;
}

export interface Answer {
  readonly degree: Degree;
  readonly correct: boolean;
}

/** What one finished session reports: which level was played, under which clef, and how. */
export interface SessionResult {
  readonly clef: Clef;
  readonly level: Level;
  /** A session aimed at the weakest degrees. It practises, it never opens a level. */
  readonly review: boolean;
  readonly answers: readonly Answer[];
}

export function noProgress(): Progress {
  return { sessions: 0, level: { treble: 1, bass: 1 } };
}

/** The share of the session answered correctly, rounded, out of a hundred. */
export function accuracyOf(answers: readonly Answer[]): number {
  if (answers.length === 0) {
    return 0;
  }

  return Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100);
}

/**
 * The record a finished session leaves behind.
 *
 * The next level opens when four things hold at once: the session was not a
 * review, it was read at or above the pass mark, it was the level the learner is
 * on — replaying an easier one opens nothing — and there is a level above it.
 *
 * The level reached is **stored** rather than worked out. A session's accuracy is
 * not kept, so nothing downstream could recompute it, and a rule that cannot be
 * recomputed is one that has to be written down.
 */
export function sessionFinished(progress: Progress, result: SessionResult): Progress {
  const { clef, level, review, answers } = result;
  const opens =
    !review &&
    answers.length > 0 &&
    accuracyOf(answers) >= PASS_MARK &&
    level === progress.level[clef] &&
    level < (LEVELS.at(-1) as Level);

  return {
    sessions: progress.sessions + 1,
    level: { ...progress.level, [clef]: opens ? ((level + 1) as Level) : progress.level[clef] },
  };
}
