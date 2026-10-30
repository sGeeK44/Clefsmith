import type { Recognition, SpeechRecognizer } from '@/domain/speech-recognizer';
import type { CorpusAudio } from '@/usecases/replay-speech-corpus';

/** One second of silence at 16 kHz — the bench times the replay, not the sound. */
export const ONE_SECOND_OF_AUDIO = 16_000;

export const audioMatchingTheManifest: CorpusAudio = {
  read: async (recording) => ({
    pcm: new Int16Array(ONE_SECOND_OF_AUDIO),
    sha256: recording.sha256,
  }),
};

/**
 * Time the tests move themselves, so that a latency can be asserted exactly
 * rather than within a tolerance that would make the suite a detector of how
 * busy the machine is.
 */
export function virtualClock() {
  let current = 0;

  return {
    now: () => current,
    sleepUntil: async (instant: number) => {
      current = Math.max(current, instant);
    },
    advance: (ms: number) => {
      current += ms;
    },
  };
}

export type VirtualClock = ReturnType<typeof virtualClock>;

/** An answer of `silent` is a recogniser that returns nothing at all. */
export type Answer = string | null | 'silent';

/**
 * A recogniser whose answers and response time are known in advance, so that
 * what the bench publishes can be compared against what it was fed.
 */
export interface Partial {
  /** Milliseconds after the utterance was flushed. */
  readonly afterMs: number;
  readonly transcript: string;
}

export function recognizerAnswering(
  clock: VirtualClock,
  answers: readonly Answer[],
  responseMs: number,
  partials: readonly Partial[] = [],
): { recognizer: SpeechRecognizer; sessions: string[][]; fedAt: number[] } {
  const sessions: string[][] = [];
  const fedAt: number[] = [];
  let utterance = 0;
  let emit: (recognition: Recognition) => void = () => undefined;

  const recognizer: SpeechRecognizer = {
    start: async (vocabulary, onRecognition) => {
      sessions.push([...vocabulary]);
      emit = onRecognition;
    },
    write: () => fedAt.push(clock.now()),
    flush: async () => {
      const flushedAt = clock.now();
      const answer = answers[utterance];
      utterance += 1;

      for (const partial of partials) {
        clock.advance(flushedAt + partial.afterMs - clock.now());
        emit({ kind: 'partial', transcript: partial.transcript, at: clock.now() });
      }

      clock.advance(flushedAt + responseMs - clock.now());

      if (answer !== 'silent') {
        emit({ kind: 'final', transcript: answer ?? null, at: clock.now() });
      }
    },
    stop: async () => undefined,
  };

  return { recognizer, sessions, fedAt };
}
