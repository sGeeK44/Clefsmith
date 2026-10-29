import type { Degree } from '@/domain/notation/pitch';

export const NOTATIONS = ['syllabic', 'letters'] as const;

export type Notation = (typeof NOTATIONS)[number];

/**
 * The two ways a learner names a degree out loud.
 *
 * A name is the name of a **degree**, never of a pitch: it is what the answer to an
 * exercise sounds like, and `b3` and `b4` are both answered "si". A caller holding a
 * pitch reaches for its degree; a caller holding only a degree — a mastery bar, a
 * revision button — has nothing to invent. The same seven words per notation are the
 * vocabulary the speech corpus was recorded against — see `bench/corpus/axes.json`,
 * which a test keeps in step with this table.
 */
const NAMES: Record<Notation, Record<Degree, string>> = {
  syllabic: { c: 'do', d: 'ré', e: 'mi', f: 'fa', g: 'sol', a: 'la', b: 'si' },
  letters: { c: 'C', d: 'D', e: 'E', f: 'F', g: 'G', a: 'A', b: 'B' },
};

export function nameOf(degree: Degree, notation: Notation): string {
  return NAMES[notation][degree];
}

/** Every name a notation can produce, which is what an answer may be. */
export function vocabularyOf(notation: Notation): readonly string[] {
  return Object.values(NAMES[notation]);
}
