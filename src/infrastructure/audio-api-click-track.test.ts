import { describe, expect, it } from 'bun:test';
import { type AudioClock, createAudioApiClickTracks } from '@/infrastructure/audio-api-click-track';

/** The bundled file, as a bundler hands it over: a module number. */
const CLICK = 42;

/** What one click left on the stand-in hardware. */
interface Written {
  readonly startedAt: number;
  /** The sound it was given, so that a click playing silence is a failure. */
  readonly plays: unknown;
  readonly reachesTheOutput: boolean;
}

/**
 * A stand-in for the audio hardware, writing down what was scheduled on it.
 *
 * It records on `start`, which is the last thing said about a click: by then it
 * is loaded and wired, so one entry is one finished click.
 */
function audioClock(currentTime: number) {
  const written: Written[] = [];
  const decoded: number[] = [];
  let closed = false;
  const destination = { connect() {} };
  const sample = { duration: 0.04 };

  const playback = () => {
    let output: unknown;
    let started = false;
    const node = {
      buffer: null as typeof sample | null,
      connect(to: unknown) {
        output = to;
      },
      /* Refuses a second start, as the library's own node does — without that,
         an adapter reusing one node for every click would pass unnoticed. */
      start(at: number) {
        if (started) {
          throw new Error('InvalidStateError');
        }

        started = true;
        written.push({
          startedAt: at,
          plays: node.buffer,
          reachesTheOutput: output === destination,
        });
      },
    };

    return node;
  };

  const clock: AudioClock = {
    currentTime,
    destination,
    decodeAudioData(asset) {
      decoded.push(asset);

      return Promise.resolve(sample);
    },
    createBufferSource: playback,
    close() {
      closed = true;

      return Promise.resolve();
    },
  };

  return {
    open: () => clock,
    written,
    decoded,
    sample,
    get closed() {
      return closed;
    },
  };
}

describe('audio api click track', () => {
  it('tells the time on the audio hardware, in milliseconds', async () => {
    const track = await createAudioApiClickTracks(audioClock(2.5).open, CLICK)();

    expect(track.now()).toBe(2500);
  });

  it('sounds a click at the instant it was written for, not at the current one', async () => {
    const hardware = audioClock(2.5);

    (await createAudioApiClickTracks(hardware.open, CLICK)()).clickAt(4000);

    expect(hardware.written[0]?.startedAt).toBe(4);
  });

  it('plays the bundled sound, through to the output', async () => {
    const hardware = audioClock(0);

    (await createAudioApiClickTracks(hardware.open, CLICK)()).clickAt(1000);

    expect([hardware.decoded, hardware.written[0]?.plays, hardware.written[0]?.reachesTheOutput]) //
      .toEqual([[CLICK], hardware.sample, true]);
  });

  it('decodes the sound once a track, however many clicks it takes', async () => {
    const hardware = audioClock(0);
    const track = await createAudioApiClickTracks(hardware.open, CLICK)();

    track.clickAt(1000);
    track.clickAt(2000);

    expect([hardware.decoded.length, hardware.written.length]).toEqual([1, 2]);
  });

  it('gives each click a playback of its own, which the library forbids restarting', async () => {
    const hardware = audioClock(0);
    const track = await createAudioApiClickTracks(hardware.open, CLICK)();

    track.clickAt(1000);

    expect(() => track.clickAt(2000)).not.toThrow();
  });

  it('releases the hardware when the track is stopped', async () => {
    const hardware = audioClock(0);

    (await createAudioApiClickTracks(hardware.open, CLICK)()).stop();

    expect(hardware.closed).toBe(true);
  });

  it('opens its own hardware per track, so a stopped session cannot deafen the next', async () => {
    let opened = 0;
    const tracks = createAudioApiClickTracks(() => {
      opened += 1;

      return audioClock(0).open();
    }, CLICK);

    await tracks();
    await tracks();

    expect(opened).toBe(2);
  });
});
