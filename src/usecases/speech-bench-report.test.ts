import { describe, expect, it } from 'bun:test';
import {
  type Answer,
  audioMatchingTheManifest,
  recognizerAnswering,
  virtualClock,
} from '#test/speech-bench';
import { confusions } from '@/domain/confusion-matrix';
import type { Corpus, Recording } from '@/domain/speech-corpus';
import { createReplaySpeechCorpus } from '@/usecases/replay-speech-corpus';
import { speechBenchReport } from '@/usecases/speech-bench-report';

const NOTES = ['do', 'mi'];

function recordingOf(speaker: string, note: string, condition: string): Recording {
  return {
    speaker,
    notation: 'syllabic',
    note,
    condition,
    audio: `${speaker}-${note}-${condition}.wav`,
    sha256: `hash-of-${speaker}-${note}-${condition}`,
    utteranceEndMs: 1000,
  };
}

const SPEAKERS = ['s1', 's2', 's3', 's4', 's5'];
const CONDITIONS = ['silence', 'instrumental'];

const CORPUS: Corpus = {
  sampleRate: 16_000,
  speakers: SPEAKERS,
  notations: { syllabic: NOTES },
  conditions: CONDITIONS,
  recordings: SPEAKERS.flatMap((speaker) =>
    NOTES.flatMap((note) => CONDITIONS.map((condition) => recordingOf(speaker, note, condition))),
  ),
};

/** Twenty utterances: five speakers, two notes, two conditions. */
const UTTERANCES = CORPUS.recordings.length;

async function benchAgainst(answers: readonly Answer[], responseMs: number) {
  const clock = virtualClock();
  const { recognizer } = recognizerAnswering(clock, answers, responseMs);
  const outcomes = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
    CORPUS,
    recognizer,
  );

  return speechBenchReport(CORPUS, outcomes);
}

/** What a recogniser that always gets it right would answer, in replay order. */
const ALWAYS_RIGHT: Answer[] = CORPUS.recordings.map((recording) => recording.note);

describe('speech bench report', () => {
  it('publishes a diagonal matrix for a recogniser that always gets it right', async () => {
    const report = await benchAgainst(ALWAYS_RIGHT, 120);

    expect(confusions(report.confusion[0])).toEqual([]);
    expect(report.confusion[0].errorRate).toBe(0);
  });

  it('publishes a known confusion on the exact pair of notes it was fed', async () => {
    const twoOfTenMisheard = ALWAYS_RIGHT.map((note, index) =>
      note === 'mi' && index < 4 ? 'do' : note,
    );

    const report = await benchAgainst(twoOfTenMisheard, 120);

    expect(confusions(report.confusion[0])).toEqual([
      { expected: 'mi', heard: 'do', count: 2, rate: 0.2 },
    ]);
  });

  it('publishes the response time of a recogniser whose response time is known', async () => {
    const report = await benchAgainst(ALWAYS_RIGHT, 137);

    expect(report.latency).toEqual({ p95Ms: 137, measured: UTTERANCES, unanswered: 0 });
  });

  it('counts the utterances that produced no result instead of timing them', async () => {
    const oneSilence: Answer[] = [...ALWAYS_RIGHT.slice(0, -1), 'silent'];

    const report = await benchAgainst(oneSilence, 137);

    expect(report.latency).toEqual({ p95Ms: 137, measured: UTTERANCES - 1, unanswered: 1 });
  });

  it('publishes what the corpus declares against what it holds', async () => {
    const report = await benchAgainst(ALWAYS_RIGHT, 120);

    expect(report.corpus).toEqual({
      declaredCells: UTTERANCES,
      recordings: UTTERANCES,
      defects: [],
    });
  });

  it('publishes the cells an incomplete corpus is missing', async () => {
    const short = { ...CORPUS, recordings: CORPUS.recordings.slice(0, -1) };

    const report = speechBenchReport(short, []);

    expect(report.corpus).toEqual({
      declaredCells: UTTERANCES,
      recordings: UTTERANCES - 1,
      defects: [
        {
          kind: 'missing',
          cell: { speaker: 's5', notation: 'syllabic', note: 'mi', condition: 'instrumental' },
        },
      ],
    });
  });

  it('counts each notation against its own notes only', () => {
    const twoNotations = { ...CORPUS, notations: { syllabic: NOTES, letters: ['A'] } };
    const inLetters = { ...recordingOf('s1', 'A', 'silence'), notation: 'letters' };
    const outcomes = [
      { recording: recordingOf('s1', 'do', 'silence'), heard: 'do', latencyMs: 10 },
      { recording: inLetters, heard: null, latencyMs: null },
    ];

    const report = speechBenchReport(twoNotations, outcomes);

    expect(report.confusion.map((matrix) => [matrix.notation, matrix.utterances])).toEqual([
      ['syllabic', 1],
      ['letters', 1],
    ]);
  });
});
