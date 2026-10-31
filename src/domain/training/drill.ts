import type { Degree, Pitch } from '@/domain/notation/pitch';
import type { Beating, Timing } from '@/domain/training/beat';
import type { Answer } from '@/domain/training/progress';
import { NOTES_PER_MEASURE } from '@/domain/training/session-settings';

/** What the learner's last attempt was worth, and what it was. */
interface Attempt {
  readonly said: Degree;
  readonly expected: Degree;
  readonly right: boolean;
  /** Nothing under no metronome: without a beat there is no moment to be late for. */
  readonly beating: Beating | undefined;
}

/**
 * What one note of the session turned out to be worth.
 *
 * A note nobody has answered carries nothing, which is not the same as a note
 * answered wrong: the staff draws the two differently, and `undefined` is what
 * tells them apart.
 */
export type Mark = 'ok' | 'late' | 'wrong';

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
  /** What each note has been worth so far, aligned with `notes`. */
  readonly marks: readonly (Mark | undefined)[];
  readonly last: Attempt | undefined;
}

export function drillOf(notes: readonly Pitch[]): Drill {
  return { notes, at: 0, answers: [], marks: notes.map(() => undefined), last: undefined };
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

  if (right) {
    return { ...marked(drill, said, undefined, drill.at), at: drill.at + 1 };
  }

  /**
   * The measure is read again, so it is shown again as unread — except the note
   * that was missed, which keeps its mark until it is said right. Clearing that
   * one too would make a mistake vanish in the same frame it was made, and the
   * learner would be sent back up the staff with nothing saying why.
   */
  const missed = drill.at;

  return {
    ...rewound(marked(drill, said, undefined, drill.at)),
    marks: rewound(drill).marks.map((mark, index) => (index === missed ? 'wrong' : mark)),
  };
}

/**
 * Back to the first note of the measure in hand, that measure shown as unread.
 *
 * It is what a mistake does and what coming back from a pause does: a measure is
 * the unit a reader re-reads, and half a measure read before an interruption is
 * not a reading of it.
 */
export function rewound(drill: Drill): Drill {
  const from = measureOf(drill.at);

  return {
    ...drill,
    at: from,
    marks: drill.marks.map((mark, index) =>
      index >= from && index <= drill.at ? undefined : mark,
    ),
  };
}

/**
 * The same notes, read from the top, with nothing kept from the reading left behind.
 *
 * The attempts go with it. A learner who asks to start over is saying the reading
 * did not count, and holding its mistakes against their accuracy would make the
 * button a punishment.
 */
export function restarted(drill: Drill): Drill {
  return drillOf(drill.notes);
}

/**
 * The same attempt, recorded against the note it was an answer to.
 *
 * What a metronome session does with a named degree: it is worth what it is
 * worth, and accuracy counts it, but it moves nothing. Under a metronome the
 * beat owns the position — rewinding to the start of the measure while the beat
 * keeps counting would put the two out of step for the rest of the session.
 *
 * The note is not where the reading stands. Understanding a word takes longer
 * than a beat, so where the reading stands is the note after the one the
 * learner was looking at; the beating says how many beats back to reach.
 */
export function scored(drill: Drill, said: Degree, beating: Beating | undefined): Drill {
  const behind = beating?.behind ?? 0;
  const at = drill.at - behind;

  /**
   * Nothing is written more than a measure late, and nothing is written twice.
   *
   * A measure's worth of beats, counted back from where the reading stands —
   * not "the measure in hand". The two sound alike and are not: a bar line
   * crossed one beat after a note would throw that note's answer away, and a
   * decoder that takes a beat to settle would lose a quarter of the session at
   * sixty to the minute and half of it at a hundred and twenty. What is being
   * bounded is how late an answer may be, so it is a span and not a boundary.
   *
   * Two readings landing on one beat is the same note answered twice, and the
   * first is the learner's.
   */
  if (behind > NOTES_PER_MEASURE || at < 0 || drill.marks[at] !== undefined) {
    return drill;
  }

  return marked(drill, said, beating, at);
}

/**
 * One attempt written against one note, and nothing else.
 *
 * It takes the note it writes against rather than reading the position, because
 * the two readings do not agree on what that note is: at the learner's own pace
 * the note answered is the one being asked for, and under a metronome it is the
 * one that was being asked for when the learner spoke. Sharing the writing and
 * not the choice is what keeps one from inheriting the other's rules.
 */
function marked(drill: Drill, said: Degree, beating: Beating | undefined, at: number): Drill {
  const expected = drill.notes[at];

  if (expected === undefined) {
    return drill;
  }

  const right = said === expected.degree;

  return {
    ...drill,
    answers: [
      ...drill.answers,
      { degree: expected.degree, correct: right, timing: beating?.timing },
    ],
    marks: drill.marks.map((mark, index) => (index === at ? markOf(right, beating?.timing) : mark)),
    /**
     * The note comes first: a wrong one is wrong whenever it was said, and
     * telling a learner their mistake was off the beat buries the mistake.
     * Accuracy counts a late right note as right — being behind the metronome
     * is something to be told, not something to be marked down for.
     */
    last: { said, expected: expected.degree, right, beating: right ? beating : undefined },
  };
}

/**
 * A beat passing, which moves the reading on whatever was said.
 *
 * It records nothing: a note nobody named is not a wrong answer, it is a note
 * the session went past. Counting it as a mistake would make a learner who said
 * nothing at all look like one who said everything wrong.
 */
export function beaten(drill: Drill): Drill {
  return isOver(drill) ? drill : { ...drill, at: drill.at + 1 };
}

function measureOf(at: number): number {
  return Math.floor(at / NOTES_PER_MEASURE) * NOTES_PER_MEASURE;
}

/** A right note said off the beat is right, and said so — it is not a mistake. */
function markOf(right: boolean, timing: Timing | undefined): Mark {
  if (!right) {
    return 'wrong';
  }

  return timing === 'off-beat' ? 'late' : 'ok';
}
