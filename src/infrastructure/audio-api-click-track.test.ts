import { describe, expect, it } from 'bun:test';
import { type AudioClock, createAudioApiClickTracks } from '@/infrastructure/audio-api-click-track';

/** What a click left on the stand-in hardware: when it sounds, and how. */
interface Written {
  readonly startedAt: number;
  readonly stoppedAt: number;
  readonly pitch: number;
  /** The instants the envelope was given a value at, in the order it was given them. */
  readonly shapedAt: readonly number[];
  readonly reachesTheOutput: boolean;
}

/**
 * A stand-in for the audio hardware, writing down what was scheduled on it.
 *
 * It records on `stop`, which is the last thing said about a click: by then it
 * is wired, shaped and started, so one entry is one finished click.
 */
function audioClock(currentTime: number) {
  const written: Written[] = [];
  let closed = false;
  const destination = { connect() {} };

  const envelope = () => {
    const shapedAt: number[] = [];
    let output: unknown;
    const node = {
      shapedAt,
      get reaches() {
        return output === destination;
      },
      connect(to: unknown) {
        output = to;
      },
      gain: {
        setValueAtTime: (_value: number, at: number) => void shapedAt.push(at),
        exponentialRampToValueAtTime: (_value: number, at: number) => void shapedAt.push(at),
      },
    };

    return node;
  };

  const oscillator = () => {
    let ridden: ReturnType<typeof envelope> | undefined;
    let startedAt = 0;
    const node = {
      frequency: { value: 0 },
      connect(to: ReturnType<typeof envelope>) {
        ridden = to;
      },
      start(at: number) {
        startedAt = at;
      },
      stop(at: number) {
        written.push({
          startedAt,
          stoppedAt: at,
          pitch: node.frequency.value,
          shapedAt: ridden?.shapedAt ?? [],
          reachesTheOutput: ridden?.reaches ?? false,
        });
      },
    };

    return node;
  };

  const clock: AudioClock = {
    currentTime,
    destination,
    createGain: envelope,
    createOscillator: oscillator,
    close() {
      closed = true;

      return Promise.resolve();
    },
  };

  return {
    open: () => clock,
    written,
    get closed() {
      return closed;
    },
  };
}

describe('audio api click track', () => {
  it('tells the time on the audio hardware, in milliseconds', () => {
    const track = createAudioApiClickTracks(audioClock(2.5).open)();

    expect(track.now()).toBe(2500);
  });

  it('sounds a click at the instant it was written for, not at the current one', () => {
    const hardware = audioClock(2.5);

    createAudioApiClickTracks(hardware.open)().clickAt(4000);

    expect(hardware.written[0]?.startedAt).toBe(4);
  });

  it('cuts each click short, so a beat is a click and not a tone', () => {
    const hardware = audioClock(0);

    createAudioApiClickTracks(hardware.open)().clickAt(1000);

    expect([hardware.written[0]?.startedAt, hardware.written[0]?.stoppedAt]).toEqual([1, 1.03]);
  });

  it('rides the click on an envelope that reaches the output', () => {
    const hardware = audioClock(0);

    createAudioApiClickTracks(hardware.open)().clickAt(1000);

    expect([hardware.written[0]?.reachesTheOutput, hardware.written[0]?.shapedAt]).toEqual([
      true,
      [1, 1.002, 1.03],
    ]);
  });

  it('releases the hardware when the track is stopped', () => {
    const hardware = audioClock(0);

    createAudioApiClickTracks(hardware.open)().stop();

    expect(hardware.closed).toBe(true);
  });

  it('opens its own hardware per track, so a stopped session cannot deafen the next', () => {
    let opened = 0;
    const tracks = createAudioApiClickTracks(() => {
      opened += 1;

      return audioClock(0).open();
    });

    tracks();
    tracks();

    expect(opened).toBe(2);
  });
});
