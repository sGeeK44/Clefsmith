import { type ConfusionMatrix, confusionMatrix } from '@/domain/confusion-matrix';
import { p95 } from '@/domain/latency';
import {
  type Corpus,
  type CorpusDefect,
  expectedCells,
  inspectCorpus,
} from '@/domain/speech-corpus';
import type { ReplayResult } from '@/usecases/replay-speech-corpus';

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
    /**
     * The same measurement taken to the **first non-empty partial** instead of
     * to the final result: the earliest the decoder commits to anything.
     *
     * Published beside the figure above rather than instead of it. The one
     * above is what a learner waits through; this one is the closest the track
     * comes to saying when they spoke, which is what evaluating timing needs.
     */
    readonly firstHeardP95Ms: number;
    /** How many utterances the figure above was computed over. */
    readonly firstHeard: number;
    /**
     * How many produced no partial at all, final result or not. An utterance
     * can settle without the decoder ever having said anything on the way, so
     * this is its own count and not `unanswered` under another name.
     */
    readonly unheard: number;
  };
  /** One matrix per notation, in the order the corpus declares them. */
  readonly confusion: readonly ConfusionMatrix[];
  /**
   * What each notation's session cost to open.
   *
   * Published per notation rather than averaged: the first session of a run
   * pays for loading the model and the later ones may not, and an average
   * would hide which of the two a user actually waits through.
   */
  readonly sessions: readonly { readonly notation: string; readonly startupMs: number }[];
}

export function speechBenchReport(corpus: Corpus, result: ReplayResult): SpeechBenchReport {
  const { outcomes, sessions } = result;

  const latencies = outcomes
    .map((outcome) => outcome.latencyMs)
    .filter((latency): latency is number => latency !== null);

  const firstHeard = outcomes
    .map((outcome) => outcome.firstHeardMs)
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
      firstHeardP95Ms: p95(firstHeard),
      firstHeard: firstHeard.length,
      unheard: outcomes.length - firstHeard.length,
    },
    confusion,
    sessions: sessions.map(({ notation, startupMs }) => ({ notation, startupMs })),
  };
}

/**
 * The one way a report is written down.
 *
 * Shared between the host run and the device run because the two are compared
 * against each other, and against the report of the other track: two spellings
 * of the same figures would show up as a difference that is not one.
 *
 * `NaN` is not a JSON value and serialises to `null`, which reads as a figure
 * rather than as the absence of one. It is spelled out instead.
 */
export function serializeSpeechBenchReport(report: SpeechBenchReport): string {
  return JSON.stringify(report, (_, value) => (Number.isNaN(value) ? 'NaN' : value), 2);
}
