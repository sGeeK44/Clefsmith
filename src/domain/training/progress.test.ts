import { describe, expect, it } from 'bun:test';
import { CLEFS } from '@/domain/notation/clef';
import type { Degree } from '@/domain/notation/pitch';
import type { Level } from '@/domain/training/level';
import {
  type Answer,
  accuracyOf,
  noProgress,
  type Progress,
  type SessionResult,
  sessionFinished,
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
    expect(noProgress()).toEqual({ sessions: 0, level: { treble: 1, bass: 1 } });
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
