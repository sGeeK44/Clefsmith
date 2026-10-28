import type { Clef } from '@/domain/notation/clef';
import { LEVELS, type Level } from '@/domain/training/level';

/** How many of the latest answers a level is judged on. */
export const WINDOW = 20;

/** How many of those may be wrong and the level still be held. */
const ALLOWED_MISTAKES = 2;

/** The latest answers to each level, oldest first, at most `WINDOW` of them. */
export type Answers = Readonly<Record<Level, readonly boolean[]>>;

/**
 * Everything the application remembers of a learner.
 *
 * Only what cannot be worked out again: the latest answers, and how many sessions
 * were finished. Whether a level is held and how far the learner has got are read
 * off those answers every time they are asked for, because a stored flag and the
 * answers that produced it drift apart and nothing notices.
 */
export interface Progress {
  readonly sessions: number;
  readonly answers: Readonly<Record<Clef, Answers>>;
}

/** A learner who has never played. */
export function noProgress(): Progress {
  return { sessions: 0, answers: { treble: nothingAnswered(), bass: nothingAnswered() } };
}

function nothingAnswered(): Answers {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
}

/**
 * The progress of a learner who has just answered one more exercise.
 *
 * The window slides: the twenty-first answer pushes the first one out. Practice
 * forgets, and a learner who has worked through a bad start should not carry it.
 */
export function answered(progress: Progress, clef: Clef, level: Level, correct: boolean): Progress {
  const latest = [...progress.answers[clef][level], correct].slice(-WINDOW);

  return {
    ...progress,
    answers: {
      ...progress.answers,
      [clef]: { ...progress.answers[clef], [level]: latest },
    },
  };
}

/** The progress of a learner who has just finished one more session. */
export function sessionFinished(progress: Progress): Progress {
  return { ...progress, sessions: progress.sessions + 1 };
}

/**
 * Whether the learner holds a level with this clef.
 *
 * A window that is not yet full is never held: three right answers say nothing
 * about a level, and an average over three would let one through on a lucky run.
 */
export function isHeld(progress: Progress, clef: Clef, level: Level): boolean {
  const latest = progress.answers[clef][level];

  return (
    latest.length === WINDOW && latest.filter((correct) => !correct).length <= ALLOWED_MISTAKES
  );
}

/**
 * The highest level the learner may play with this clef.
 *
 * The first level they do not hold, which is level 1 for a learner who has never
 * played, and the last level once they hold every one of them. The two clefs are
 * two skills: neither opens anything for the other.
 */
export function highestOpenLevel(progress: Progress, clef: Clef): Level {
  return LEVELS.find((level) => !isHeld(progress, clef, level)) ?? (LEVELS.at(-1) as Level);
}
