import type { Clock } from '@/core/clock';
import type { Recognition, SpeechRecognizer } from '@/domain/speech-recognizer';
import { virtualClock } from './virtual-clock';

export interface Track {
  readonly clock: Clock;
  readonly recognizer: SpeechRecognizer;
}

/**
 * The tracks the bench can replay a corpus through.
 *
 * CLE-17 decides between two real ones, which arrive with CLE-20 and CLE-21.
 * The fakes below are not stand-ins for them: they are what the bench is
 * checked against, because what they will answer is known before they are run.
 */
export const TRACKS: Record<string, () => Track> = {
  'fixture-perfect': () => fixtureTrack(0, 0),
  'fixture-slow': () => fixtureTrack(137, 0),
  'fixture-confusing': () => fixtureTrack(0, 2),
};

/**
 * A recogniser that reads the note out of the fixture corpus audio itself.
 *
 * Every sample of a fixture recording holds the index of the note being said,
 * so this answers from what it was actually fed — through the manifest, the
 * file and the decoder — rather than from a list it was handed. A bench that
 * fed it the wrong file would be caught here.
 *
 * `mishearEvery` makes it answer the next note along at a known rate, so that
 * the published confusion can be compared to the confusion that was arranged.
 */
function fixtureTrack(responseMs: number, mishearEvery: number): Track {
  const clock = virtualClock();
  let vocabulary: readonly string[] = [];
  let emit: (recognition: Recognition) => void = () => undefined;
  let heard = -1;
  let utterance = 0;

  const recognizer: SpeechRecognizer = {
    start: async (words, onRecognition) => {
      vocabulary = words;
      emit = onRecognition;
    },
    write: (pcm) => {
      if (pcm.length === 0) {
        return;
      }

      const note = pcm[0] as number;

      /**
       * Refused rather than read, because a real recording would still give a
       * number here: whatever its first sample happens to be, indexed into the
       * vocabulary. The bench would publish a confusion matrix built from that
       * — figures that look like a measurement and are not one. This is the
       * fixture encoding, and a file that does not carry it is not a file this
       * track can answer from.
       */
      if (pcm.some((sample) => sample !== note)) {
        throw new Error(
          'a fixture track was fed audio that is not a fixture recording: every sample of a fixture recording holds the index of the note being said. Replay bench/fixture-corpus, or use a real track.',
        );
      }

      heard = note;
    },
    flush: async () => {
      clock.advance(responseMs);

      const mishear = mishearEvery > 0 && utterance % mishearEvery === 0;
      const index = mishear ? (heard + 1) % vocabulary.length : heard;
      utterance += 1;

      emit({ kind: 'final', transcript: vocabulary[index] ?? null, at: clock.now() });
    },
    stop: async () => undefined,
  };

  return { clock, recognizer };
}
