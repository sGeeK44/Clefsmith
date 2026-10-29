import { describe, expect, it } from 'bun:test';
import { CLEFS } from '@/domain/notation/clef';
import type { Degree } from '@/domain/notation/pitch';
import { LEVELS, type Level } from '@/domain/training/level';
import {
  type Answer,
  accuracyOf,
  masteryOf,
  noProgress,
  type Progress,
  reachOf,
  type SessionResult,
  sessionFinished,
  weakestOf,
} from '@/domain/training/progress';

/** One session, right unless `wrong` names the degree. */
function session(over: Partial<SessionResult> = {}): SessionResult {
  return { clef: 'treble', level: 1, review: false, answers: answers('cde'), ...over };
}

/** `'cde'` is three right answers; an upper-case degree is a wrong one. */
function answers(read: string): readonly Answer[] {
  return [...read].map((letter) => ({
    degree: letter.toLowerCase() as Degree,
    correct: letter === letter.toLowerCase(),
  }));
}

function after(...results: readonly SessionResult[]): Progress {
  return results.reduce(sessionFinished, noProgress());
}

describe('a learner who has never played', () => {
  it('is on the first level of both clefs, with nothing behind them', () => {
    expect(noProgress()).toEqual({
      sessions: 0,
      level: { treble: 1, bass: 1 },
      mastery: { treble: {}, bass: {} },
    });
  });
});

describe('the accuracy of a session', () => {
  it('is the share answered correctly, out of a hundred', () => {
    expect(accuracyOf(answers('cdeF'))).toBe(75);
  });

  it('is rounded, because a screen shows a whole number', () => {
    expect(accuracyOf(answers('cdE'))).toBe(67);
  });

  it('is zero when nothing was answered, rather than undefined arithmetic', () => {
    expect(accuracyOf([])).toBe(0);
  });
});

describe('finishing a session', () => {
  it('counts, whatever was read and however it went', () => {
    expect(after(session({ answers: answers('CDE') })).sessions).toBe(1);
  });

  it('opens the next level when the session was read at the pass mark', () => {
    // Three right out of four is exactly 75 %.
    expect(after(session({ answers: answers('cdeF') })).level.treble).toBe(2);
  });

  it('opens nothing just below it', () => {
    // Eleven right out of fifteen is 73 %, which rounds nowhere near the mark.
    expect(after(session({ answers: answers('cdecdecdecdCDEF') })).level.treble).toBe(1);
  });

  it('opens nothing when nothing was answered', () => {
    expect(after(session({ answers: [] })).level.treble).toBe(1);
  });

  it('opens nothing on a review, however well it went', () => {
    expect(after(session({ review: true })).level.treble).toBe(1);
  });

  it('opens nothing when an easier level is replayed', () => {
    const opened = after(session(), session({ level: 2 }), session({ level: 1 }));

    expect(opened.level.treble).toBe(3);
  });

  it('opens nothing when there is nothing above', () => {
    const top = [1, 2, 3, 4, 5].map((level) => session({ level: level as Level }));

    expect(after(...top, session({ level: 6 })).level).toEqual({ treble: 6, bass: 1 });
  });

  it('opens one clef and leaves the other where it was', () => {
    for (const clef of CLEFS) {
      expect(after(session({ clef })).level[clef]).toBe(2);
    }
  });

  it('opens one level at a time, however long the session', () => {
    expect(after(session({ answers: answers('cdecdecde') })).level.treble).toBe(2);
  });
});

describe('the mastery of a degree', () => {
  it('is unknown until the degree has been met, which is not a score of zero', () => {
    expect(masteryOf(noProgress(), 'treble', 'c')).toBeUndefined();
  });

  it('rises by two for a degree met in the session', () => {
    expect(masteryOf(after(session()), 'treble', 'c')).toBe(2);
  });

  it('rises by two whether it was met once or nine times', () => {
    expect(masteryOf(after(session({ answers: answers('ccccccccc') })), 'treble', 'c')).toBe(2);
  });

  it('falls by four for each mistake, after the session has been credited', () => {
    expect(after(session({ answers: answers('cdeCC') })).mastery.treble).toEqual({
      c: 0,
      d: 2,
      e: 2,
    });
  });

  it('costs four a mistake on a degree that has something to lose', () => {
    const built = Array.from({ length: 5 }, () => session({ answers: answers('c'), level: 6 }));

    // Five clean sessions make ten; the sixth adds two and takes four back.
    expect(
      masteryOf(after(...built, session({ answers: answers('cC'), level: 6 })), 'treble', 'c'),
    ).toBe(8);
  });

  it('never falls below nothing, however bad the session', () => {
    expect(masteryOf(after(session({ answers: answers('CCCC') })), 'treble', 'c')).toBe(0);
  });

  it('never climbs past a hundred, however many sessions', () => {
    const many = Array.from({ length: 60 }, () => session({ level: 6 }));

    expect(masteryOf(after(...many), 'treble', 'c')).toBe(100);
  });

  it('leaves a degree the session did not meet exactly where it was', () => {
    expect(masteryOf(after(session(), session({ answers: answers('d') })), 'treble', 'c')).toBe(2);
  });

  it('is kept per clef, so reading "do" in bass is not reading it in treble', () => {
    const played = after(session({ clef: 'bass' }));

    expect([masteryOf(played, 'bass', 'c'), masteryOf(played, 'treble', 'c')]).toEqual([
      2,
      undefined,
    ]);
  });
});

describe('the degrees read worst', () => {
  it('are the lowest scores, weakest first', () => {
    const played = after(
      session({ answers: answers('cdeCC') }),
      session({ answers: answers('d') }),
    );

    expect(weakestOf(played, 'treble', 2)).toEqual(['c', 'e']);
  });

  it('leaves out a degree never met, which is unknown rather than weak', () => {
    expect(weakestOf(after(session({ answers: answers('CD') })), 'treble', 7)).toEqual(['c', 'd']);
  });

  it('breaks a tie by the order the degrees climb an octave', () => {
    expect(weakestOf(after(session({ answers: answers('edc') })), 'treble', 2)).toEqual(['c', 'd']);
  });

  it('hands back fewer than asked for rather than inventing one', () => {
    expect(weakestOf(noProgress(), 'treble', 2)).toEqual([]);
  });
});

describe('where a level sits for a learner', () => {
  it('puts everything behind the level they are on', () => {
    const played = after(session(), session({ level: 2 }), session({ level: 3 }));

    expect(LEVELS.map((level) => reachOf(played, 'treble', level))).toEqual([
      'done',
      'done',
      'done',
      'current',
      'ahead',
      'ahead',
    ]);
  });

  it('reads each clef against its own progress', () => {
    const played = after(session({ clef: 'bass' }));

    expect(reachOf(played, 'bass', 2)).toBe('current');
    expect(reachOf(played, 'treble', 2)).toBe('ahead');
  });
});
