import type { Clock } from '@/core/clock';
import type { Recognition, SpeechRecognizer } from '@/domain/speech-recognizer';

/** Cancels one event subscription. */
interface VoskSubscription {
  remove(): void;
}

/**
 * The slice of `react-native-vosk` this adapter uses.
 *
 * Declared here rather than imported so the adapter can be driven by a stand-in
 * under test: the real module reaches for a native TurboModule the moment it is
 * imported, which no test runner has.
 *
 * `pushAudio`, `acceptWaveform` and `finish` are not upstream — they come from
 * `patches/react-native-vosk@2.1.7.patch`, which says why.
 */
export interface VoskModule {
  loadModel(path: string): Promise<void>;
  start(options: { grammar: string[]; pushAudio: boolean }): Promise<void>;
  acceptWaveform(pcmBase64: string): void;
  finish(): void;
  stop(): void;
  unload(): void;
  onResult(callback: (text: string) => void): VoskSubscription;
  onPartialResult(callback: (text: string) => void): VoskSubscription;
  onFinalResult(callback: (text: string) => void): VoskSubscription;
  onError(callback: (error: string) => void): VoskSubscription;
}

/**
 * The word a constrained grammar falls back on when it heard something that is
 * not in it.
 *
 * It has to be in the grammar. Without it the decoder has no way to say "not
 * one of these" and answers with the closest word it was given, so an utterance
 * from outside the vocabulary comes back as a note — which is exactly what the
 * closed vocabulary is supposed to make impossible.
 */
export const UNKNOWN = '[unk]';

/** Samples arrive as 16-bit, so two bytes leave for every one that arrives. */
const BYTES_PER_SAMPLE = 2;
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encodes 16-bit little-endian PCM the way the patched native side reads it.
 *
 * Written out rather than taken from a library because React Native ships
 * neither `btoa` nor `Buffer`, and the alternative — handing the bridge an
 * array of numbers — allocates once per sample instead of once per frame.
 */
export function encodeBase64Pcm(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.length * BYTES_PER_SAMPLE);
  const view = new DataView(bytes.buffer);

  for (let index = 0; index < pcm.length; index += 1) {
    view.setInt16(index * BYTES_PER_SAMPLE, pcm[index] as number, true);
  }

  let encoded = '';

  for (let at = 0; at < bytes.length; at += 3) {
    const chunk =
      ((bytes[at] as number) << 16) | ((bytes[at + 1] ?? 0) << 8) | (bytes[at + 2] ?? 0);
    const remaining = bytes.length - at;

    encoded += BASE64[(chunk >> 18) & 63];
    encoded += BASE64[(chunk >> 12) & 63];
    encoded += remaining > 1 ? BASE64[(chunk >> 6) & 63] : '=';
    encoded += remaining > 2 ? BASE64[chunk & 63] : '=';
  }

  return encoded;
}

export function createVoskSpeechRecognizer(options: {
  vosk: VoskModule;
  clock: Clock;
  modelPath: string;
}): SpeechRecognizer {
  const { vosk, clock, modelPath } = options;
  let subscriptions: VoskSubscription[] = [];
  let settleUtterance: (() => void) | undefined;

  return {
    async start(vocabulary, onRecognition) {
      /**
       * One final result per utterance, not two.
       *
       * The decoder settles on its own once an utterance goes quiet, and says so
       * through `onResult`. `finish` then reports what is left, which after a
       * settled utterance is nothing — an empty transcript that would overwrite
       * the answer already given, and time the latency at the flush instead of
       * at the moment the decoder actually settled.
       */
      let settled = false;

      const final = (transcript: string | null): Recognition => ({
        kind: 'final',
        transcript,
        at: clock.now(),
      });

      await vosk.loadModel(modelPath);

      subscriptions = [
        vosk.onPartialResult((transcript) => {
          onRecognition({ kind: 'partial', transcript, at: clock.now() });
        }),
        vosk.onResult((transcript) => {
          settled = true;
          onRecognition(final(transcript === UNKNOWN ? null : transcript));
        }),
        vosk.onFinalResult((transcript) => {
          if (!settled) {
            onRecognition(final(transcript === '' || transcript === UNKNOWN ? null : transcript));
          }

          settled = false;
          settleUtterance?.();
        }),
        vosk.onError((error) => {
          throw new Error(`the Vosk recogniser failed mid-session: ${error}`);
        }),
      ];

      await vosk.start({ grammar: [...vocabulary, UNKNOWN], pushAudio: true });
    },

    write(pcm) {
      vosk.acceptWaveform(encodeBase64Pcm(pcm));
    },

    flush() {
      return new Promise<void>((resolve) => {
        settleUtterance = () => {
          settleUtterance = undefined;
          resolve();
        };

        vosk.finish();
      });
    },

    async stop() {
      for (const subscription of subscriptions) {
        subscription.remove();
      }

      subscriptions = [];
      vosk.stop();
      vosk.unload();
    },
  };
}
