import { describe, expect, it } from 'bun:test';

import {
  countLine,
  expectedLine,
  legendOf,
  OFF_BEAT,
  offsetLine,
  PAUSE,
  paceLine,
  RESTART,
  RIGHT,
  shadeOf,
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
    expect(verdictOf({ said: 'c', expected: 'c', right: true, beating: undefined })).toBe('right');
    expect(verdictOf({ said: 'c', expected: 'd', right: false, beating: undefined })).toBe('wrong');
  });

  it('says a right note said off the beat is neither simply right nor wrong', () => {
    expect(
      verdictOf({
        said: 'c',
        expected: 'c',
        right: true,
        beating: { timing: 'off-beat', offset: 700, behind: 0 },
      }),
    ).toBe('off-beat');
  });

  it('says nothing about the beat when the note was in time', () => {
    expect(
      verdictOf({
        said: 'c',
        expected: 'c',
        right: true,
        beating: { timing: 'in-time', offset: 0, behind: 0 },
      }),
    ).toBe('right');
  });

  it('says which side of the beat a note fell on, and how far off', () => {
    expect(offsetLine({ timing: 'off-beat', offset: 700, behind: 0 })).toBe('En retard · ±700 ms');
    expect(offsetLine({ timing: 'off-beat', offset: -700, behind: 0 })).toBe('En avance · ±700 ms');
  });

  it('says a note inside the window is in time rather than which side it leans', () => {
    expect(offsetLine({ timing: 'in-time', offset: -120, behind: 0 })).toBe('À temps · ±120 ms');
  });

  it("rounds the figure: a tenth of a millisecond is nobody's precision", () => {
    expect(offsetLine({ timing: 'in-time', offset: 119.6, behind: 0 })).toBe('À temps · ±120 ms');
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

describe('how a note of the session is drawn', () => {
  it('draws the note being read as the one being read, whatever it was worth', () => {
    expect(shadeOf(2, 2, 'wrong')).toBe('current');
  });

  it('keeps what a note behind the learner was worth', () => {
    expect(shadeOf(1, 2, 'late')).toBe('late');
  });

  it('leaves a note nobody has answered at the ink', () => {
    expect(shadeOf(5, 2, undefined)).toBe('ahead');
  });
});

describe('the legend under the staff', () => {
  it('names the off-beat colour where there is a beat to be beside', () => {
    expect(legendOf(true).map(({ label }) => label)).toEqual(['Juste', 'Décalé', 'Faux']);
  });

  it('leaves it out where there is none', () => {
    expect(legendOf(false).map(({ label }) => label)).toEqual(['Juste', 'Faux']);
  });
});

describe('how the session is to be read', () => {
  it('asks for the beat where there is one', () => {
    expect(paceLine(true)).toBe('Dites chaque note en rythme');
  });

  it('leaves the pace to the learner where there is none', () => {
    expect(paceLine(false)).toBe('Lisez à votre rythme');
  });
});

describe('the icon a button on the exercise carries', () => {
  /**
   * Emoji presentation, as the platforms decide it: the pictographs, the
   * dingbats, and the handful of technical symbols — ⏸ among them — that
   * Unicode gave a colour face. A variation selector is not a defence, because
   * Android ignores the one that asks for text.
   */
  const COLOURED = /[\u{231A}-\u{23FA}\u{2600}-\u{27BF}\u{1F000}-\u{1FAFF}]|\u{FE0F}/u;

  it.each([
    ['the pause', PAUSE],
    ['the restart', RESTART],
  ])('draws %s in a glyph no platform turns into a colour emoji', (_what, label) => {
    expect(label).not.toMatch(COLOURED);
  });
});
