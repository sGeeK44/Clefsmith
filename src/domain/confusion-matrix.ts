/**
 * What one replayed utterance produced: the note that was said, and the note
 * the recogniser returned — `null` when it returned nothing at all.
 *
 * Nothing recognised is an error like any other, and it gets its own column
 * rather than being folded into a wrong note: a track that stays silent and a
 * track that confidently says `si` fail for reasons that call for different
 * answers.
 */
export interface Observation {
  readonly expected: string;
  readonly heard: string | null;
}

export interface Confusion {
  readonly expected: string;
  readonly heard: string | null;
  readonly count: number;
  /**
   * The share of the utterances of `expected` that landed here. A threshold on
   * a note pair is a threshold on this: a note said ten times and misheard
   * twice is a 20 % confusion, whatever the rest of the corpus does.
   */
  readonly rate: number;
}

export interface ConfusionMatrix {
  readonly notation: string;
  /** Rows, in the order the corpus declares them. */
  readonly notes: readonly string[];
  /** The full grid: every note against every note, plus the nothing column. */
  readonly cells: readonly Confusion[];
  readonly utterances: number;
  /**
   * The share of utterances that did not come back as themselves.
   *
   * `NaN` when the notation was never observed — a corpus defect, which
   * `inspectCorpus` reports, and which no threshold can be read as passing.
   */
  readonly errorRate: number;
}

/**
 * The grid is built from the notes the corpus declares, not from the notes that
 * were heard: a note the recogniser never once returned must still show its
 * empty column, and a note it never got right must still show its empty
 * diagonal.
 */
export function confusionMatrix(
  notation: string,
  notes: readonly string[],
  observations: readonly Observation[],
): ConfusionMatrix {
  const columns: (string | null)[] = [...notes, null];
  const cells: Confusion[] = [];
  let correct = 0;

  for (const expected of notes) {
    const said = observations.filter((observation) => observation.expected === expected);

    for (const heard of columns) {
      const count = said.filter((observation) => observation.heard === heard).length;

      if (heard === expected) {
        correct += count;
      }

      cells.push({ expected, heard, count, rate: count / said.length });
    }
  }

  const utterances = observations.length;

  return { notation, notes, cells, utterances, errorRate: (utterances - correct) / utterances };
}

/** The off-diagonal cells that actually happened, worst first. */
export function confusions(matrix: ConfusionMatrix): Confusion[] {
  return matrix.cells
    .filter((cell) => cell.count > 0 && cell.heard !== cell.expected)
    .sort((a, b) => b.rate - a.rate);
}
