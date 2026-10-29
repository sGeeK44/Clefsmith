import { describe, expect, it } from 'bun:test';
import { NO_FIGURE, reviewLine, scoreLine, toneOf } from '@/components/wording/progress';

describe('reading a mastery score out', () => {
  it('says the score of a degree that has been met', () => {
    expect(scoreLine(42)).toBe('42');
  });

  it('says zero for a degree met and read wrong every time', () => {
    expect(scoreLine(0)).toBe('0');
  });

  it('says nothing was earned for a degree never met', () => {
    expect(scoreLine(undefined)).toBe(NO_FIGURE);
  });

  it('calls out a degree read badly, and leaves a steady one alone', () => {
    expect(toneOf(69)).toBe('bad');
    expect(toneOf(70)).toBe('late');
    expect(toneOf(79)).toBe('late');
    expect(toneOf(80)).toBe('ink');
  });

  it('gives a degree never met no colour of its own', () => {
    expect(toneOf(undefined)).toBe('muted');
  });
});

describe('the revision on offer', () => {
  it('names the two weakest degrees, weakest first', () => {
    expect(reviewLine(['f', 'c'], 'syllabic')).toBe('Réviser fa et do');
  });

  it('names them under the notation the learner chose', () => {
    expect(reviewLine(['f', 'c'], 'letters')).toBe('Réviser F et C');
  });
});
