import type { Clef } from '@/domain/notation/clef';
import { DEGREES, type Degree } from '@/domain/notation/pitch';
import type { Timing } from '@/domain/training/beat';
import { LEVELS, type Level } from '@/domain/training/level';

/** The share of a session that has to be right for the next level to open. */
const PASS_MARK = 75;

/** What meeting a degree once in a session is worth, and what each mistake on it costs. */
const GAINED = 2;
const LOST = 4;

const LOWEST = 0;
const HIGHEST = 100;

/**
 * How well each degree is read, out of a hundred.
 *
 * Degrees, not pitches: `b3` and `b4` are both "si", and a learner who hesitates
 * on one hesitates on the other. A degree that has never been met carries **no**
 * score rather than a zero — a screen can say "not yet" instead of showing a
 * figure nobody earned.
 */
export type Mastery = Partial<Record<Degree, number>>;

/**
 * How much of what was read under a metronome fell on the beat, counted rather
 * than averaged.
 *
 * Two running totals, not a running percentage: a percentage of percentages
 * weighs a four-measure session as heavily as a sixteen-measure one, and the
 * learner who practises longer would see their figure matter less.
 */
export interface Beats {
  readonly timed: number;
  readonly onTime: number;
}

export interface Progress {
  readonly sessions: number;
  readonly beats: Beats;
  readonly level: Readonly<Record<Clef, Level>>;
  readonly mastery: Readonly<Record<Clef, Mastery>>;
}

export interface Answer {
  readonly degree: Degree;
  readonly correct: boolean;
  /**
   * When it was said against the beat, or nothing at all when there was no beat
   * to say it against. A reading at the learner's own pace has no timing to
   * report, which is not the same as having been read off the beat.
   */
  readonly timing?: Timing;
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
  return {
    sessions: 0,
    beats: { timed: 0, onTime: 0 },
    level: { treble: 1, bass: 1 },
    mastery: { treble: {}, bass: {} },
  };
}

/**
 * How well the learner keeps time, over everything they have ever read to one.
 *
 * Nothing at all until something has been read to a metronome — the same rule
 * as a degree never met: a figure nobody has earned is not a zero.
 */
export function rhythmOf(progress: Progress): number | undefined {
  const { timed, onTime } = progress.beats;

  return timed === 0 ? undefined : Math.round((onTime / timed) * 100);
}

/** The share of the session answered correctly, rounded, out of a hundred. */
export function accuracyOf(answers: readonly Answer[]): number {
  if (answers.length === 0) {
    return 0;
  }

  return Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100);
}

/**
 * The share of a beaten session said on the beat, rounded, out of a hundred.
 *
 * Only the answers that were timed are counted, on both sides of the division:
 * a session read without a metronome reports **nothing** rather than nought,
 * because nothing was asked of it.
 *
 * A wrong note said on the beat still counts as on the beat. The two figures
 * answer two questions — did you read it, and did you read it in time — and
 * folding one into the other would leave neither answered.
 */
export function onTimeOf(answers: readonly Answer[]): number | undefined {
  const timed = answers.filter((answer) => answer.timing !== undefined);

  if (timed.length === 0) {
    return undefined;
  }

  return Math.round(
    (timed.filter((answer) => answer.timing === 'in-time').length / timed.length) * 100,
  );
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

  const timed = answers.filter((answer) => answer.timing !== undefined);

  return {
    sessions: progress.sessions + 1,
    beats: {
      timed: progress.beats.timed + timed.length,
      onTime: progress.beats.onTime + timed.filter((one) => one.timing === 'in-time').length,
    },
    level: { ...progress.level, [clef]: opens ? ((level + 1) as Level) : progress.level[clef] },
    mastery: { ...progress.mastery, [clef]: rescored(progress.mastery[clef], answers) },
  };
}

/**
 * Where a learner says they are starting from, in the treble alone.
 *
 * The bass is another skill and starts where it starts. The level never comes
 * down either: someone replaying the introduction is situating themselves again,
 * not undoing what they have already opened.
 */
export function startedAt(progress: Progress, level: Level): Progress {
  return {
    ...progress,
    level: { ...progress.level, treble: Math.max(progress.level.treble, level) as Level },
  };
}

/** Where a level sits for a learner: behind them, under them, or ahead of them. */
export type Reach = 'done' | 'current' | 'ahead';

export function reachOf(progress: Progress, clef: Clef, level: Level): Reach {
  const on = progress.level[clef];

  if (level < on) {
    return 'done';
  }

  return level === on ? 'current' : 'ahead';
}

export function masteryOf(progress: Progress, clef: Clef, degree: Degree): number | undefined {
  return progress.mastery[clef][degree];
}

/**
 * The degrees read worst, weakest first, at most as many as asked for.
 *
 * Only degrees that have been met: a degree with no score is not weak, it is
 * unknown, and sending a learner to revise a note they have never seen is not
 * revision. Ties are broken by the order the degrees climb an octave.
 */
export function weakestOf(progress: Progress, clef: Clef, count: number): readonly Degree[] {
  const scored = DEGREES.filter((degree) => masteryOf(progress, clef, degree) !== undefined);

  return [...scored]
    .sort((one, other) => (progress.mastery[clef][one] ?? 0) - (progress.mastery[clef][other] ?? 0))
    .slice(0, count);
}

/**
 * Met once is met: the gain is per session, not per note drawn, so a session that
 * happens to draw "fa" nine times is not nine times the practice. Mistakes are
 * counted one by one, because they are the thing being corrected.
 */
function rescored(mastery: Mastery, answers: readonly Answer[]): Mastery {
  const scores: Mastery = { ...mastery };

  for (const degree of new Set(answers.map((answer) => answer.degree))) {
    scores[degree] = (mastery[degree] ?? LOWEST) + GAINED;
  }

  for (const { degree, correct } of answers) {
    if (!correct) {
      scores[degree] = (scores[degree] ?? LOWEST) - LOST;
    }
  }

  return bounded(scores);
}

function bounded(mastery: Mastery): Mastery {
  return Object.fromEntries(
    Object.entries(mastery).map(([degree, score]) => [
      degree,
      Math.min(HIGHEST, Math.max(LOWEST, score)),
    ]),
  );
}
