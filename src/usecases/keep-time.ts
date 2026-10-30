import type { Clock } from '@/core/clock';
import { beatAt } from '@/domain/training/beat';

/**
 * Keeping time for a session, until it is told to stop.
 *
 * The caller gets a way to stop rather than a promise to await: a session ends
 * when its last note is read or when the learner leaves, and neither is known
 * to whoever is counting the beats.
 */
export type KeepTime = (tempo: number, beat: (passed: number, at: number) => void) => () => void;

export function createKeepTime(clock: Clock): KeepTime {
  return (tempo, beat) => {
    const startedAt = clock.now();
    let stopped = false;

    /**
     * The start of the session is handed over as beat zero, before anything is
     * waited for. The note already on screen was put there by it, and a caller
     * that has to ask what time the session started would be asking the clock
     * this port exists to hide.
     */
    beat(0, startedAt);

    /**
     * Every beat is waited for from the start of the session, so what the beat
     * itself costs is not added to the next one. A loop that slept one interval
     * at a time would run late by a little more at every measure.
     */
    const keep = async () => {
      for (let passed = 1; !stopped; passed += 1) {
        await clock.sleepUntil(beatAt(startedAt, passed, tempo));

        if (!stopped) {
          beat(passed, beatAt(startedAt, passed, tempo));
        }
      }
    };

    void keep();

    return () => {
      stopped = true;
    };
  };
}
