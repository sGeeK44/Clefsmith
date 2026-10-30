import { describe, expect, it } from 'bun:test';
import { beatAt, beatIntervalMs, beatOf } from '@/domain/training/beat';

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
});
