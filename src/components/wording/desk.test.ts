import { describe, expect, it } from 'bun:test';

import { badgeLine, progressOf } from '@/components/wording/desk';

describe('an exercise on the desk', () => {
  it('says where the learner is up to, out of the six studies', () => {
    expect(badgeLine(true, 4)).toBe('4 / 6');
  });

  it('says nothing of the sort before the record has been read', () => {
    expect(badgeLine(true, undefined)).toBe('');
  });

  it('announces itself rather than a level when there is nothing behind it', () => {
    expect(badgeLine(false, 4)).toBe('Bientôt');
  });

  it('leaves the bar empty on the first study: nothing is behind the learner yet', () => {
    expect(progressOf(true, 1)).toBe(0);
  });

  it('keeps the bar short of full on the last study, which is still to read', () => {
    expect(progressOf(true, 6)).toBe(5 / 6);
  });

  it('draws no progress at all on an exercise with nothing behind it', () => {
    expect(progressOf(false, 6)).toBe(0);
  });
});
