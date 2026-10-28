import { describe, expect, it } from 'bun:test';
import {
  audioMatchingTheManifest,
  ONE_SECOND_OF_AUDIO,
  recognizerAnswering,
  virtualClock,
} from '#test/speech-bench';
import type { Corpus, Recording } from '@/domain/speech-corpus';
import {
  type CorpusAudio,
  createReplaySpeechCorpus,
  type ReplayOutcome,
} from '@/usecases/replay-speech-corpus';

const SAMPLE_RATE = 16_000;

function recordingOf(note: string): Recording {
  return {
    speaker: 's1',
    notation: 'syllabic',
    note,
    condition: 'silence',
    audio: `${note}.wav`,
    sha256: `hash-of-${note}`,
    utteranceEndMs: 1000,
  };
}

const CORPUS: Corpus = {
  sampleRate: SAMPLE_RATE,
  speakers: ['s1'],
  notations: { syllabic: ['do', 'mi'] },
  conditions: ['silence'],
  recordings: [recordingOf('do'), recordingOf('mi')],
};

describe('replay a speech corpus', () => {
  it('publishes what the recogniser answered, recording by recording', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'si'], 120);

    const outcomes: ReplayOutcome[] = await createReplaySpeechCorpus(
      clock,
      audioMatchingTheManifest,
    )(CORPUS, recognizer);

    expect(outcomes.map((outcome) => outcome.heard)).toEqual(['do', 'si']);
  });

  it('times the final result from the annotated end of the utterance', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 120);

    const outcomes = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes.map((outcome) => outcome.latencyMs)).toEqual([120, 120]);
  });

  it('feeds a recording over the time it takes to say it', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 0);

    await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(CORPUS, recognizer);

    expect(clock.now()).toBe(2000);
  });

  it('times nothing for an utterance the recogniser never answered', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'silent'], 120);

    const outcomes = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes[1]).toMatchObject({ heard: null, latencyMs: null });
  });

  it('still times an utterance the recogniser answered nothing to', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, [null, 'mi'], 120);

    const outcomes = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes[0]).toMatchObject({ heard: null, latencyMs: 120 });
  });

  it('hands the audio over in frames spread across the time it was spoken', async () => {
    const clock = virtualClock();
    const { recognizer, fedAt } = recognizerAnswering(clock, ['do', 'mi'], 0);

    await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(CORPUS, recognizer);

    expect(fedAt.slice(0, 3)).toEqual([0, 20, 40]);
    expect(fedAt.slice(0, 50).at(-1)).toBe(980);
  });

  it('opens one session per notation, on that notation vocabulary', async () => {
    const clock = virtualClock();
    const { recognizer, sessions } = recognizerAnswering(clock, ['do', 'mi'], 0);

    await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(CORPUS, recognizer);

    expect(sessions).toEqual([['do', 'mi']]);
  });

  it('refuses audio that is not the file the manifest annotated', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 0);
    const otherTake: CorpusAudio = {
      read: async () => ({ pcm: new Int16Array(ONE_SECOND_OF_AUDIO), sha256: 'some-other-take' }),
    };

    const replay = createReplaySpeechCorpus(clock, otherTake)(CORPUS, recognizer);

    await expect(replay).rejects.toThrow('do.wav');
  });
});
