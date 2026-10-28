import type { Clock } from '@/core/clock';
import type { Corpus, Recording } from '@/domain/speech-corpus';
import type { Recognition, SpeechRecognizer } from '@/domain/speech-recognizer';

/**
 * How the bench gets at the audio a manifest entry names. A port, because the
 * host reads it from a repository checkout and a device reads it from wherever
 * the dev build put it, and neither belongs in the replay itself.
 */
export interface CorpusAudio {
  read(recording: Recording): Promise<{ pcm: Int16Array; sha256: string }>;
}

export interface ReplayOutcome {
  readonly recording: Recording;
  /** The note the recogniser settled on, or `null` if it settled on nothing. */
  readonly heard: string | null;
  /**
   * Milliseconds from the annotated end of the utterance to the final result,
   * or `null` when there was no final result to time.
   *
   * Left out rather than filled in: a stand-in latency for an utterance that
   * produced nothing would be averaged in with measurements. How many produced
   * nothing is published on its own.
   */
  readonly latencyMs: number | null;
}

/**
 * How much audio is handed over at a time.
 *
 * Twenty milliseconds is what streaming recognisers consume internally; handing
 * over a whole file instead would give a track its audio before it was spoken,
 * and make every latency this bench publishes a fiction.
 */
const FRAME_MS = 20;

export type ReplaySpeechCorpus = (
  corpus: Corpus,
  recognizer: SpeechRecognizer,
) => Promise<ReplayOutcome[]>;

/**
 * Replays the corpus through a recogniser, one notation at a time.
 *
 * One session per notation, not one per utterance: the vocabulary is what the
 * session is opened on, and reopening it between every note would measure the
 * cost of loading a grammar instead of the cost of hearing a word.
 */
export function createReplaySpeechCorpus(clock: Clock, audio: CorpusAudio): ReplaySpeechCorpus {
  return async (corpus, recognizer) => {
    const outcomes: ReplayOutcome[] = [];

    for (const [notation, notes] of Object.entries(corpus.notations)) {
      const finals: Extract<Recognition, { kind: 'final' }>[] = [];

      await recognizer.start(notes, (recognition) => {
        if (recognition.kind === 'final') {
          finals.push(recognition);
        }
      });

      for (const recording of corpus.recordings.filter((it) => it.notation === notation)) {
        finals.length = 0;

        const spokenUntil = await feed(recording, corpus.sampleRate, clock, audio, recognizer);
        await recognizer.flush();

        const final = finals.at(-1);

        outcomes.push({
          recording,
          heard: final === undefined ? null : final.transcript,
          latencyMs: final === undefined ? null : final.at - spokenUntil,
        });
      }

      await recognizer.stop();
    }

    return outcomes;
  };
}

/** Feeds one recording at the rate it was spoken, and says when it was spoken until. */
async function feed(
  recording: Recording,
  sampleRate: number,
  clock: Clock,
  audio: CorpusAudio,
  recognizer: SpeechRecognizer,
): Promise<number> {
  const { pcm, sha256 } = await audio.read(recording);

  if (sha256 !== recording.sha256) {
    throw new Error(
      `${recording.audio} is not the file the manifest annotated: the end of its utterance was measured on other audio.`,
    );
  }

  const samplesPerFrame = Math.round((sampleRate * FRAME_MS) / 1000);
  const startedAt = clock.now();

  for (let frame = 0; frame * samplesPerFrame < pcm.length; frame += 1) {
    await clock.sleepUntil(startedAt + frame * FRAME_MS);
    recognizer.write(pcm.subarray(frame * samplesPerFrame, (frame + 1) * samplesPerFrame));
  }

  /**
   * The last frame is handed over at the instant it starts, not the instant it
   * ends. Waiting out its own duration is what makes the replay last exactly as
   * long as the recording, and what stops a recogniser being credited with
   * answering before the audio it answered to had been spoken.
   */
  await clock.sleepUntil(startedAt + (pcm.length / sampleRate) * 1000);

  return startedAt + recording.utteranceEndMs;
}
