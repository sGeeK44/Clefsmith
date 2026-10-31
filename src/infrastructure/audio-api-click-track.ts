import type { ClickTrack, OpenClickTrack } from '@/usecases/play-clicks';

interface Connectable {
  connect(destination: Connectable): void;
}

/**
 * A sound the hardware has finished decoding, kept to be played again.
 *
 * Opaque on purpose: nothing here reads it, it is only handed back to the node
 * that plays it. `duration` is there so that only a decoded sound satisfies the
 * type — an empty object would otherwise pass for one.
 */
interface Sample {
  readonly duration: number;
}

/**
 * One playback of a sample, on the audio timeline.
 *
 * Single use: the library refuses to start a node twice, so a click is a node
 * and the sample behind it is shared. There is no `stop` — the node ends by
 * itself at the end of the sample, which is what makes it a click.
 */
interface Playback extends Connectable {
  buffer: Sample | null;
  start(at: number): void;
}

/**
 * The slice of `react-native-audio-api` this adapter uses.
 *
 * Declared here rather than imported, for the same reason the Vosk module is:
 * the real one reaches for a native module on import, which no test runner has
 * — and the architecture check forbids an adapter from importing a renderer's
 * package at all. The root hands the real constructor in.
 */
export interface AudioClock {
  readonly currentTime: number;
  readonly destination: Connectable;
  decodeAudioData(asset: number): Promise<Sample>;
  createBufferSource(): Playback;
  close(): Promise<void>;
}

export type OpenAudioClock = () => AudioClock;

const SECOND = 1000;

/**
 * Plays one recorded click per beat, rather than synthesising one.
 *
 * Both platforms used to draw the same oscillator and render it differently —
 * on the iPhone 16 the click came out drier and quieter than on Android. A
 * decoded sample is the same numbers everywhere, so there is one sound and no
 * pair of per-platform constants to keep in agreement.
 *
 * `asset` is what `require()` returns for the bundled file: a module number the
 * library resolves itself. It is handed in rather than required here, because
 * `require` of an asset is a bundler's trick and no test runner has it.
 */
export function createAudioApiClickTracks(
  openClock: OpenAudioClock,
  asset: number,
): OpenClickTrack {
  return async (): Promise<ClickTrack> => {
    const clock = openClock();
    /* Once per track, and before the track is handed over: decoding is the
       only thing here that takes time, and a beat may not wait for it. */
    const click = await clock.decodeAudioData(asset);

    return {
      now: () => clock.currentTime * SECOND,

      clickAt(instant) {
        const playback = clock.createBufferSource();

        playback.buffer = click;
        playback.connect(clock.destination);
        playback.start(instant / SECOND);
      },

      stop() {
        void clock.close();
      },
    };
  };
}
