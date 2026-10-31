import type { ClickTrack, OpenClickTrack } from '@/usecases/play-clicks';

/** One scheduled value of a node's parameter, on the audio clock, in seconds. */
interface AudioParameter {
  setValueAtTime(value: number, at: number): void;
  exponentialRampToValueAtTime(value: number, at: number): void;
}

interface Connectable {
  connect(destination: Connectable): void;
}

interface Gain extends Connectable {
  readonly gain: AudioParameter;
}

interface Oscillator extends Connectable {
  readonly frequency: { value: number };
  start(at: number): void;
  stop(at: number): void;
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
  createOscillator(): Oscillator;
  createGain(): Gain;
  close(): Promise<void>;
}

export type OpenAudioClock = () => AudioClock;

const SECOND = 1000;
/** A click, not a note: short enough to have no pitch of its own to follow. */
const PITCH = 1000;
const ATTACK = 0.002;
const DECAY = 0.03;
/**
 * Silence, written as the smallest audible figure rather than zero: an
 * exponential ramp is undefined at zero and would leave the gain where it was.
 */
const SILENT = 0.0001;

/**
 * Clicks, written on the audio hardware's own clock.
 *
 * Every instant the use case hands over is a date in the future on that clock,
 * which is the whole point: the beat is decided by the audio thread and not by
 * when JavaScript happened to wake up.
 */
export function createAudioApiClickTracks(openClock: OpenAudioClock): OpenClickTrack {
  return (): Promise<ClickTrack> => {
    const clock = openClock();

    /* Nothing to wait for while the click is synthesised: the hardware is
       usable the instant it is handed over. The promise is the port's, not
       this adapter's. */
    return Promise.resolve({
      now: () => clock.currentTime * SECOND,

      clickAt(instant) {
        const at = instant / SECOND;
        const click = clock.createOscillator();
        const envelope = clock.createGain();

        click.frequency.value = PITCH;
        click.connect(envelope);
        envelope.connect(clock.destination);
        envelope.gain.setValueAtTime(SILENT, at);
        envelope.gain.exponentialRampToValueAtTime(1, at + ATTACK);
        envelope.gain.exponentialRampToValueAtTime(SILENT, at + DECAY);
        click.start(at);
        click.stop(at + DECAY);
      },

      stop() {
        void clock.close();
      },
    });
  };
}
