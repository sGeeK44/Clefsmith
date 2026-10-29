import { CLEFS } from '@/domain/notation/clef';
import { LEVELS, type Level } from '@/domain/training/level';
import { noProgress, type Progress } from '@/domain/training/progress';

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

  return level === undefined ? undefined : { sessions: value.sessions, level };
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

function readLevel(value: unknown): Level | undefined {
  return LEVELS.find((level) => level === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
