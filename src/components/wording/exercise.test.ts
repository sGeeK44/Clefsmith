import { describe, expect, it } from 'bun:test';

import {
  countLine,
  expectedLine,
  OFF_BEAT,
  RIGHT,
  shareOf,
  toneOf,
  verdictLine,
  verdictOf,
  WRONG,
} from '@/components/wording/exercise';

describe('what the exercise screen says', () => {
  it('counts the note being read from one, not from zero', () => {
    expect(countLine(0, 32)).toBe('1 / 32');
    expect(countLine(6, 32)).toBe('7 / 32');
  });

  it('holds on the last note once the session is over', () => {
    expect(countLine(32, 32)).toBe('32 / 32');
  });

  it('draws the share of the session already read', () => {
    expect(shareOf(0, 16)).toBe(0);
    expect(shareOf(4, 16)).toBe(0.25);
    expect(shareOf(16, 16)).toBe(1);
  });

  it('waits before anything has been said', () => {
    expect(verdictOf(undefined)).toBe('waiting');
  });

  it('tells a right answer from a wrong one', () => {
    expect(verdictOf({ said: 'c', expected: 'c', right: true, timing: undefined })).toBe('right');
    expect(verdictOf({ said: 'c', expected: 'd', right: false, timing: undefined })).toBe('wrong');
  });

  it('says a right note said off the beat is neither simply right nor wrong', () => {
    expect(verdictOf({ said: 'c', expected: 'c', right: true, timing: 'off-beat' })).toBe(
      'off-beat',
    );
  });

  it('says nothing about the beat when the note was in time', () => {
    expect(verdictOf({ said: 'c', expected: 'c', right: true, timing: 'in-time' })).toBe('right');
  });

  it('names the note that was missed, in the notation the learner chose', () => {
    expect(expectedLine('g', 'syllabic')).toBe("C'était un sol");
    expect(expectedLine('g', 'letters')).toBe("C'était un G");
  });

  it('says each of the three verdicts in its own words', () => {
    expect([verdictLine('right'), verdictLine('off-beat'), verdictLine('wrong')]).toEqual([
      RIGHT,
      OFF_BEAT,
      WRONG,
    ]);
  });

  it('keeps the wrong answer’s colour for a wrong answer only', () => {
    expect([toneOf('right'), toneOf('off-beat'), toneOf('wrong')]).toEqual(['ok', 'late', 'bad']);
  });
});
