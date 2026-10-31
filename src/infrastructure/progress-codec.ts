import { CLEFS } from '@/domain/notation/clef';
import { DEGREES, type Degree } from '@/domain/notation/pitch';
import { LEVELS, type Level } from '@/domain/training/level';
import { type Beats, type Mastery, noProgress, type Progress } from '@/domain/training/progress';

/**
 * The shape of what is written down.
 *
 * It travels with the application and outlives it: a record written by a newer
 * version is one this one cannot be trusted to read, so it is refused rather than
 * half-understood. Schema 1 held a sliding
 * window of answers per level, a rule this version no longer has — those records
 * start the learner over.
 */
const SCHEMA = 2;

const LOWEST = 0;
const HIGHEST = 100;

export function encode(progress: Progress): string {
  return JSON.stringify({ schema: SCHEMA, ...progress });
}

/**
 * The record written down, or that of a learner who has never played.
 *
 * Never throws. A record that cannot be read — never written, truncated, hand-edited,
 * written by a newer version — starts the learner over. Losing a practice history
 * is not worth a crash at every launch, and there is nothing here to recover.
 */
export function decode(written: string | null): Progress {
  return readProgress(parse(written)) ?? noProgress();
}

function parse(written: string | null): unknown {
  try {
    return JSON.parse(written ?? '');
  } catch {
    return undefined;
  }
}

function readProgress(value: unknown): Progress | undefined {
  if (!isRecord(value) || value.schema !== SCHEMA || !isCount(value.sessions)) {
    return undefined;
  }

  const level = readPerClef(value.level, readLevel);
  const mastery = readPerClef(value.mastery, readMastery);

  return level === undefined || mastery === undefined
    ? undefined
    : { sessions: value.sessions, beats: readBeats(value.beats), level, mastery };
}

function readPerClef<T>(
  value: unknown,
  readOne: (value: unknown) => T | undefined,
): Readonly<Record<'treble' | 'bass', T>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const read = CLEFS.map((clef) => [clef, readOne(value[clef])] as const);

  return read.some(([, one]) => one === undefined)
    ? undefined
    : (Object.fromEntries(read) as Readonly<Record<'treble' | 'bass', T>>);
}

/**
 * The beats kept, or none.
 *
 * Absent is the normal case rather than an error: records written before the
 * application counted beats are schema 2 and nothing about them is wrong — they
 * simply have no rhythm behind them yet. Unreadable counts are read the same
 * way, which costs a learner a figure and not their whole history.
 */
function readBeats(value: unknown): Beats {
  if (!isRecord(value) || !isCount(value.timed) || !isCount(value.onTime)) {
    return { timed: 0, onTime: 0 };
  }

  return value.onTime > value.timed
    ? { timed: 0, onTime: 0 }
    : { timed: value.timed, onTime: value.onTime };
}

function readLevel(value: unknown): Level | undefined {
  return LEVELS.find((level) => level === value);
}

/**
 * A degree with no score is a degree never met, so an absent key is read as such
 * rather than refused. A key that is not a degree, or a score outside the bounds
 * the rules keep it in, is a record this version did not write.
 */
function readMastery(value: unknown): Mastery | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const read = Object.entries(value);
  const sound = read.every(
    ([degree, score]) => DEGREES.includes(degree as Degree) && isScore(score),
  );

  return sound ? (Object.fromEntries(read) as Mastery) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isScore(value: unknown): value is number {
  return isCount(value) && value >= LOWEST && value <= HIGHEST;
}
