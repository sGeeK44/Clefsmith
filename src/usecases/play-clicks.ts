import type { Clock } from '@/core/clock';
import { beatAt } from '@/domain/training/beat';

/**
 * The audio hardware's timeline, as a port.
 *
 * It is a second clock, and deliberately not the one `Clock` speaks for: the
 * wall clock says when JavaScript was woken up, this one says when a sample
 * will leave the speaker. A click dated on the first is a click that drifts,
 * because being woken late is the normal behaviour of a timer and not a fault.
 */
export interface ClickTrack {
  /** Milliseconds on the audio timeline, monotonic while the track is open. */
  now(): number;
  /** Puts one click on that timeline, at an instant that has not arrived yet. */
  clickAt(instant: number): void;
  /** Closes the track and drops whatever was still scheduled on it. */
  stop(): void;
}

/**
 * How far ahead clicks are written onto the audio timeline.
 *
 * Long enough that a wake-up missed by a wide margin still lands inside what
 * was already scheduled, short enough that stopping is heard as stopping. The
 * refill runs twice per horizon, so one lost refill costs nothing.
 */
const HORIZON = 500;

/**
 * A track is opened per session and closed with it: closing releases the audio
 * hardware, and what is released cannot be scheduled on again.
 *
 * Opening is asynchronous because the sound a click is made of has to be read
 * and decoded before any click can be written down, and a track handed over
 * half-opened would take beats it could not sound.
 */
export type OpenClickTrack = () => Promise<ClickTrack>;

export type PlayClicks = (tempo: number) => () => void;

/**
 * A click on every beat, until it is told to stop.
 *
 * The wall clock only decides *when to write the next clicks down*; it is never
 * what is heard. Whatever lateness it brings is absorbed by the horizon, and
 * the instants themselves are computed from the start of the track on the audio
 * timeline — the same rule the screen beats are drawn by.
 */
export function createPlayClicks(openTrack: OpenClickTrack, clock: Clock): PlayClicks {
  return (tempo) => {
    let stopped = false;
    let clicks: ClickTrack | undefined;

    const keep = async () => {
      const track = await openTrack();

      if (stopped) {
        /* Stopping before the track was open leaves nothing to close; the
           hardware arrives anyway, and closing it here is what releases it. */
        track.stop();

        return;
      }

      clicks = track;
      const startedAt = track.now();
      const wokeAt = clock.now();
      let next = 0;

      const fill = () => {
        while (beatAt(startedAt, next, tempo) < track.now() + HORIZON) {
          track.clickAt(beatAt(startedAt, next, tempo));
          next += 1;
        }
      };

      fill();

      for (let refill = 1; !stopped; refill += 1) {
        await clock.sleepUntil(wokeAt + (refill * HORIZON) / 2);

        if (!stopped) {
          fill();
        }
      }
    };

    void keep();

    return () => {
      stopped = true;
      clicks?.stop();
    };
  };
}
