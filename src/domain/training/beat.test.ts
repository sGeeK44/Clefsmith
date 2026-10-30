import { describe, expect, it } from 'bun:test';
import { beatAt, beatIntervalMs, beatOf, timingOf } from '@/domain/training/beat';

describe('the beat grid', () => {
  it('beats once a second at sixty to the minute', () => {
    expect(beatIntervalMs(60)).toBe(1000);
  });

  it('beats four times as often at a hundred and sixty', () => {
    expect(beatIntervalMs(160)).toBe(beatIntervalMs(40) / 4);
  });

  it('places every beat from the start of the session, not from the one before', () => {
    const late = 7;

    expect([0, 1, 2].map((beat) => beatAt(late, beat, 60))).toEqual([7, 1007, 2007]);
  });

  it('counts the beats of a measure from zero', () => {
    expect([0, 1, 2, 3].map(beatOf)).toEqual([0, 1, 2, 3]);
  });

  it('comes back to the first beat on the note that opens the next measure', () => {
    expect(beatOf(4)).toBe(0);
  });

  describe('the tolerance window', () => {
    /** The beat the note on screen was put there by, a second into a session at sixty. */
    const BEAT = 1000;

    it('calls a note started on its beat in time', () => {
      expect(timingOf(BEAT, BEAT, 60)).toBe('in-time');
    });

    it('calls a note started a whole beat late off the beat', () => {
      expect(timingOf(BEAT + 1000, BEAT, 60)).toBe('off-beat');
    });

    it('tolerates as much ahead of the beat as behind it', () => {
      expect(timingOf(BEAT - 400, BEAT, 60)).toBe('in-time');
      expect(timingOf(BEAT - 600, BEAT, 60)).toBe('off-beat');
    });

    it('tolerates the same lead at one tempo and not at another', () => {
      const lead = 300;

      expect(timingOf(BEAT - lead, BEAT, 60)).toBe('in-time');
      expect(timingOf(BEAT - lead, BEAT, 160)).toBe('off-beat');
    });

    it('turns a note in time into a late one when it is timed on the decoder settling', () => {
      /** What CLE-20 measured from the end of an utterance to the final result. */
      const settling = 838;

      expect(timingOf(BEAT, BEAT, 60)).toBe('in-time');
      expect(timingOf(BEAT + settling, BEAT, 60)).toBe('off-beat');
    });
  });
});
