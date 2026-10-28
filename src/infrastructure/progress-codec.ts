import { CLEFS } from '@/domain/notation/clef';
import { LEVELS } from '@/domain/training/level';
import { type Answers, noProgress, type Progress, WINDOW } from '@/domain/training/progress';

/**
 * The shape of what is written down.
 *
 * It travels with the application and outlives it: a record written by a newer
 * version is one this one cannot be trusted to read, so it is refused rather than
 * half-understood.
 */
const SCHEMA = 1;

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

  const answers = readClefs(value.answers);

  return answers === undefined ? undefined : { sessions: value.sessions, answers };
}

function readClefs(value: unknown): Progress['answers'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const read = CLEFS.map((clef) => [clef, readLevels(value[clef])] as const);

  return read.some(([, answers]) => answers === undefined)
    ? undefined
    : (Object.fromEntries(read) as Progress['answers']);
}

function readLevels(value: unknown): Answers | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const read = LEVELS.map((level) => [level, readLatest(value[level])] as const);

  return read.some(([, latest]) => latest === undefined)
    ? undefined
    : (Object.fromEntries(read) as Answers);
}

function readLatest(value: unknown): readonly boolean[] | undefined {
  if (!Array.isArray(value) || value.length > WINDOW) {
    return undefined;
  }

  return value.every((answer) => typeof answer === 'boolean') ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
