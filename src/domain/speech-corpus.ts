/**
 * One cell of the corpus grid: one speaker saying one note of one notation
 * under one recording condition.
 */
export interface Cell {
  readonly speaker: string;
  readonly notation: string;
  readonly note: string;
  readonly condition: string;
}

export interface Recording extends Cell {
  /** Path of the audio file, relative to the corpus root. */
  readonly audio: string;
  /**
   * SHA-256 of that file. The manifest annotates an offset into one specific
   * recording; a file swapped without the offset being re-annotated would
   * shift every latency this corpus produces, and nothing would say so.
   */
  readonly sha256: string;
  /**
   * Where the speaker stops talking, in milliseconds from the start of the
   * file. Annotated when the recording is made: detecting it at replay time
   * would make the bench's own detector part of what the bench measures.
   */
  readonly utteranceEndMs: number;
}

/**
 * The axes are declared, not derived from the recordings: a corpus that
 * described itself by what it happens to contain could never be incomplete.
 *
 * Notes are named per notation because the two notations do not name the same
 * things — and the bench stays agnostic to which notes they are. What the
 * application calls a note is settled elsewhere; here it is whatever was
 * recorded.
 */
export interface Corpus {
  readonly speakers: readonly string[];
  readonly notations: Readonly<Record<string, readonly string[]>>;
  readonly conditions: readonly string[];
  readonly recordings: readonly Recording[];
}

export type CorpusDefect =
  | { readonly kind: 'missing'; readonly cell: Cell }
  | { readonly kind: 'duplicate'; readonly cell: Cell }
  | { readonly kind: 'undeclared'; readonly cell: Cell };

/**
 * Joined on a character no label contains, so that a condition named
 * `instrumental noise` cannot collide with a note named `instrumental`.
 */
const SEPARATOR = '\u0000';

function keyOf(cell: Cell): string {
  return [cell.speaker, cell.notation, cell.note, cell.condition].join(SEPARATOR);
}

/** Every cell the declared axes call for, in a stable order. */
export function expectedCells(corpus: Corpus): Cell[] {
  const cells: Cell[] = [];

  for (const speaker of corpus.speakers) {
    for (const [notation, notes] of Object.entries(corpus.notations)) {
      for (const note of notes) {
        for (const condition of corpus.conditions) {
          cells.push({ speaker, notation, note, condition });
        }
      }
    }
  }

  return cells;
}

/**
 * What the corpus is missing, holds twice, or holds outside its own axes.
 *
 * Returned rather than thrown, and in full: a corpus short of forty cells is
 * one recording session to plan, not forty runs that each reveal the next one.
 */
export function inspectCorpus(corpus: Corpus): CorpusDefect[] {
  const defects: CorpusDefect[] = [];
  const recorded = new Map<string, number>();

  for (const recording of corpus.recordings) {
    const key = keyOf(recording);
    recorded.set(key, (recorded.get(key) ?? 0) + 1);
  }

  const declared = new Set<string>();

  for (const cell of expectedCells(corpus)) {
    const key = keyOf(cell);
    declared.add(key);
    const count = recorded.get(key) ?? 0;

    if (count === 0) {
      defects.push({ kind: 'missing', cell });
    } else if (count > 1) {
      defects.push({ kind: 'duplicate', cell });
    }
  }

  for (const { speaker, notation, note, condition } of corpus.recordings) {
    if (!declared.has(keyOf({ speaker, notation, note, condition }))) {
      defects.push({ kind: 'undeclared', cell: { speaker, notation, note, condition } });
    }
  }

  return defects;
}
