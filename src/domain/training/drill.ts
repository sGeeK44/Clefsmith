import type { Degree, Pitch } from '@/domain/notation/pitch';
import type { Answer } from '@/domain/training/progress';
import { NOTES_PER_MEASURE } from '@/domain/training/session-settings';

/** What the learner's last attempt was worth, and what it was. */
interface Attempt {
  readonly said: Degree;
  readonly expected: Degree;
  readonly right: boolean;
}

/**
 * A session being read, note by note.
 *
 * It is a value, not an object: answering returns a new drill. A whole session
 * is then a fold over the degrees the learner named, which is what makes the
 * rules below provable one line at a time and without a screen.
 */
export interface Drill {
  readonly notes: readonly Pitch[];
  /** The note being read. Past the last one once the session is over. */
  readonly at: number;
  /** Every attempt, in order — the thing accuracy is counted over. */
  readonly answers: readonly Answer[];
  readonly last: Attempt | undefined;
}

export function drillOf(notes: readonly Pitch[]): Drill {
  return { notes, at: 0, answers: [], last: undefined };
}

export function isOver(drill: Drill): boolean {
  return drill.at >= drill.notes.length;
}

/** The note the learner is being asked for, or nothing once the session is over. */
export function expectedOf(drill: Drill): Pitch | undefined {
  return drill.notes[drill.at];
}

/**
 * What naming a degree does to the session.
 *
 * Right, and the reading moves on. Wrong, and it goes back to the **start of the
 * measure**: the notes already read in it are read again, because a measure is
 * the unit a reader re-reads, with or without a metronome keeping time.
 *
 * Either way the attempt is recorded. Accuracy is counted over attempts rather
 * than over notes — a measure re-read three times costs what it cost.
 */
export function answered(drill: Drill, said: Degree): Drill {
  const expected = expectedOf(drill);

  if (expected === undefined) {
    return drill;
  }

  const right = said === expected.degree;

  return {
    ...drill,
    at: right ? drill.at + 1 : measureOf(drill.at),
    answers: [...drill.answers, { degree: expected.degree, correct: right }],
    last: { said, expected: expected.degree, right },
  };
}

function measureOf(at: number): number {
  return Math.floor(at / NOTES_PER_MEASURE) * NOTES_PER_MEASURE;
}
