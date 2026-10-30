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
  type ReplayResult,
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

    const { outcomes }: ReplayResult = await createReplaySpeechCorpus(
      clock,
      audioMatchingTheManifest,
    )(CORPUS, recognizer);

    expect(outcomes.map((outcome) => outcome.heard)).toEqual(['do', 'si']);
  });

  it('times the final result from the annotated end of the utterance', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 120);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
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

  it('times the first word the recogniser said, from the annotated end of the utterance', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 120, [
      { afterMs: 40, transcript: 'd' },
    ]);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes.map((outcome) => outcome.firstHeardMs)).toEqual([40, 40]);
  });

  it('keeps the first partial and not the ones that refine it', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 120, [
      { afterMs: 40, transcript: 'd' },
      { afterMs: 90, transcript: 'do' },
    ]);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes.map((outcome) => outcome.firstHeardMs)).toEqual([40, 40]);
  });

  it('passes over an empty partial: nothing was heard, no word was started', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 120, [
      { afterMs: 10, transcript: '' },
      { afterMs: 40, transcript: 'd' },
    ]);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes.map((outcome) => outcome.firstHeardMs)).toEqual([40, 40]);
  });

  it('times nothing for an utterance the recogniser never started saying', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 120);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes.map((outcome) => outcome.firstHeardMs)).toEqual([null, null]);
  });

  it('times nothing for an utterance the recogniser never answered', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'silent'], 120);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      recognizer,
    );

    expect(outcomes[1]).toMatchObject({ heard: null, latencyMs: null });
  });

  it('still times an utterance the recogniser answered nothing to', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, [null, 'mi'], 120);

    const { outcomes } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
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

  it('times how long each notation session took to open', async () => {
    const clock = virtualClock();
    const { recognizer } = recognizerAnswering(clock, ['do', 'mi'], 0);
    const slowToOpen = {
      ...recognizer,
      start: async (
        vocabulary: readonly string[],
        onRecognition: Parameters<typeof recognizer.start>[1],
      ) => {
        clock.advance(450);

        return recognizer.start(vocabulary, onRecognition);
      },
    };

    const { sessions } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      CORPUS,
      slowToOpen,
    );

    expect(sessions).toEqual([{ notation: 'syllabic', startupMs: 450 }]);
  });

  it('times one session per notation, because the grammar is fixed when it opens', async () => {
    const clock = virtualClock();
    const twoNotations: Corpus = {
      ...CORPUS,
      notations: { syllabic: ['do'], letters: ['C'] },
      recordings: [recordingOf('do'), { ...recordingOf('C'), notation: 'letters' }],
    };
    const { recognizer } = recognizerAnswering(clock, ['do', 'C'], 0);

    const { sessions } = await createReplaySpeechCorpus(clock, audioMatchingTheManifest)(
      twoNotations,
      recognizer,
    );

    expect(sessions.map((session) => session.notation)).toEqual(['syllabic', 'letters']);
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
