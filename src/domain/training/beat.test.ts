import { describe, expect, it } from 'bun:test';
import { BAND, beatAt, beatIntervalMs, beatingOf, beatOf, meterOf } from '@/domain/training/beat';

describe('the beat grid', () => {
  /** The beat the note on screen was put there by, a second into a session at sixty. */
  const BEAT = 1000;

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
    it('calls a note started on its beat in time', () => {
      expect(beatingOf(BEAT, BEAT, 60).timing).toBe('in-time');
    });

    it('calls a note started a whole beat late off the beat', () => {
      expect(beatingOf(BEAT + 1000, BEAT, 60).timing).toBe('off-beat');
    });

    it('tolerates the same delay at one tempo and not at another', () => {
      const late = 300;

      expect(beatingOf(BEAT + late, BEAT, 60).timing).toBe('in-time');
      expect(beatingOf(BEAT + late, BEAT, 160).timing).toBe('off-beat');
    });

    it('measures how far into its own beat the note fell', () => {
      expect(beatingOf(BEAT + 120, BEAT, 60).offset).toBe(120);
    });

    it('turns a note in time into a late one when it is timed on the decoder settling', () => {
      /** What CLE-20 measured from the end of an utterance to the final result. */
      const settling = 838;

      expect(beatingOf(BEAT, BEAT, 60).timing).toBe('in-time');
      expect(beatingOf(BEAT + settling, BEAT, 60).timing).toBe('off-beat');
    });
  });

  describe('which beat an utterance belongs to', () => {
    it('is the beat passing, for a word settled before the next one', () => {
      expect(beatingOf(BEAT + 120, BEAT, 60).behind).toBe(0);
    });

    it('is the beat it was said on, not the one the grid has reached since', () => {
      const beating = beatingOf(BEAT - 400, BEAT, 60);

      expect(beating.behind).toBe(1);
      expect(beating.offset).toBe(600);
    });

    it('reaches back as many beats as the decoder took', () => {
      expect(beatingOf(BEAT - 1200, BEAT, 60).behind).toBe(2);
    });

    it('reaches back further at a tempo whose beats are shorter', () => {
      const settling = 900;

      expect(beatingOf(BEAT - settling, BEAT, 60).behind).toBe(1);
      expect(beatingOf(BEAT - settling, BEAT, 160).behind).toBe(3);
    });

    it('never credits a word to a beat the session has not reached', () => {
      expect(beatingOf(BEAT + 5000, BEAT, 60).behind).toBe(0);
    });

    it('counts a word started on a beat as said on that beat, not the one before', () => {
      const beating = beatingOf(BEAT - 1000, BEAT, 60);

      expect(beating.behind).toBe(1);
      expect(beating.offset).toBe(0);
    });
  });
});

describe('the meter the timing is read on', () => {
  it('puts a note said on its beat in the middle of the track', () => {
    expect(meterOf(0, 60)).toBe(0.5);
  });

  it('draws the band as the tolerance itself: a note at its edge lands on the band', () => {
    expect(meterOf(500, 60)).toBeCloseTo(BAND.to, 10);
    expect(meterOf(-500, 60)).toBeCloseTo(BAND.from, 10);
  });

  it('gives the band a third of the track, which is what makes it aimable', () => {
    expect([BAND.from, BAND.to]).toEqual([1 / 3, 2 / 3]);
  });

  it('spans the same number of beats whatever the tempo, not the same milliseconds', () => {
    expect(meterOf(250, 120)).toBe(meterOf(500, 60));
  });

  it('holds a note further off than the track reaches at the end it ran past', () => {
    expect(meterOf(9000, 60)).toBe(1);
    expect(meterOf(-9000, 60)).toBe(0);
  });
});
