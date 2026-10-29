import { NOTATIONS, type Notation } from '@/domain/notation/naming';
import { defaultSettings, type Settings } from '@/domain/settings';

/**
 * The shape of what is written down.
 *
 * Its own schema number, counted apart from the progression's: the two records
 * are written by different rules and there is no reason for one to move when the
 * other does.
 */
const SCHEMA = 1;

export function encode(settings: Settings): string {
  return JSON.stringify({ schema: SCHEMA, ...settings });
}

/**
 * The choices written down, or those of a learner who has chosen nothing.
 *
 * Never throws. A record that cannot be read — never written, truncated,
 * hand-edited, written by a newer version, naming a notation this one does not
 * have — reads back as the default rather than as an error. A setting is not
 * worth a crash at every launch.
 */
export function decode(written: string | null): Settings {
  return readSettings(parse(written)) ?? defaultSettings();
}

function parse(written: string | null): unknown {
  try {
    return JSON.parse(written ?? '');
  } catch {
    return undefined;
  }
}

function readSettings(value: unknown): Settings | undefined {
  if (!isRecord(value) || value.schema !== SCHEMA) {
    return undefined;
  }

  const notation = readNotation(value.notation);

  return notation === undefined ? undefined : { notation };
}

function readNotation(value: unknown): Notation | undefined {
  return NOTATIONS.find((notation) => notation === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
