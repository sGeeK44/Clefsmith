import { type ConfusionMatrix, confusionMatrix } from '@/domain/confusion-matrix';
import { p95 } from '@/domain/latency';
import {
  type Corpus,
  type CorpusDefect,
  expectedCells,
  inspectCorpus,
} from '@/domain/speech-corpus';
import type { ReplayOutcome } from '@/usecases/replay-speech-corpus';

export interface SpeechBenchReport {
  /**
   * What the corpus holds against what it declares. Published on every run,
   * not only when it is wrong: a figure computed over four fifths of the grid
   * is a different figure, and the only way to notice is to see the count.
   */
  readonly corpus: {
    readonly declaredCells: number;
    readonly recordings: number;
    readonly defects: readonly CorpusDefect[];
  };
  readonly latency: {
    readonly p95Ms: number;
    /** How many utterances the p95 above was computed over. */
    readonly measured: number;
    /**
     * How many produced no final result at all. Published next to the p95
     * rather than folded into it: a track that answers nothing is fast, and
     * a percentile alone would say so.
     */
    readonly unanswered: number;
  };
  /** One matrix per notation, in the order the corpus declares them. */
  readonly confusion: readonly ConfusionMatrix[];
}

export function speechBenchReport(
  corpus: Corpus,
  outcomes: readonly ReplayOutcome[],
): SpeechBenchReport {
  const latencies = outcomes
    .map((outcome) => outcome.latencyMs)
    .filter((latency): latency is number => latency !== null);

  const confusion = Object.entries(corpus.notations).map(([notation, notes]) =>
    confusionMatrix(
      notation,
      notes,
      outcomes
        .filter((outcome) => outcome.recording.notation === notation)
        .map((outcome) => ({ expected: outcome.recording.note, heard: outcome.heard })),
    ),
  );

  return {
    corpus: {
      declaredCells: expectedCells(corpus).length,
      recordings: corpus.recordings.length,
      defects: inspectCorpus(corpus),
    },
    latency: {
      p95Ms: p95(latencies),
      measured: latencies.length,
      unanswered: outcomes.length - latencies.length,
    },
    confusion,
  };
}
