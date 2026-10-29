import { describe, expect, it } from 'bun:test';
import {
  defaultSessionSettings,
  exercisesIn,
  faster,
  MEASURES,
  slower,
} from '@/domain/training/session-settings';

describe('the tempo of a session', () => {
  it('starts at a beat a second', () => {
    expect(defaultSessionSettings().tempo).toBe(60);
  });

  it('moves ten at a time', () => {
    expect(faster(60)).toBe(70);
    expect(slower(60)).toBe(50);
  });

  it('never goes under forty, however often it is asked to', () => {
    expect(slower(slower(slower(50)))).toBe(40);
  });

  it('never goes over a hundred and sixty', () => {
    expect(faster(faster(faster(150)))).toBe(160);
  });
});

describe('the length of a session', () => {
  it('counts four notes to a measure', () => {
    expect(exercisesIn(8)).toBe(32);
  });

  it('starts at eight measures', () => {
    expect(defaultSessionSettings().measures).toBe(8);
  });

  it('offers four lengths, each a multiple of the shortest', () => {
    expect(MEASURES).toEqual([4, 8, 12, 16]);
  });
});
