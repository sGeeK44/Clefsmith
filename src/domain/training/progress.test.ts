import { describe, expect, it } from 'bun:test';
import { CLEFS, type Clef } from '@/domain/notation/clef';
import { LEVELS, type Level } from '@/domain/training/level';
import {
  answered,
  highestOpenLevel,
  isHeld,
  noProgress,
  type Progress,
  sessionFinished,
  WINDOW,
} from '@/domain/training/progress';

/** Answers `verdicts` in order, at one level of one clef. */
function after(progress: Progress, clef: Clef, level: Level, verdicts: readonly boolean[]) {
  return verdicts.reduce((sofar, correct) => answered(sofar, clef, level, correct), progress);
}

function right(count: number): readonly boolean[] {
  return Array.from({ length: count }, () => true);
}

function wrong(count: number): readonly boolean[] {
  return Array.from({ length: count }, () => false);
}

/** A learner who holds every level with `clef`, and nothing with the other. */
function holdsEverything(clef: Clef): Progress {
  return LEVELS.reduce((sofar, level) => after(sofar, clef, level, right(WINDOW)), noProgress());
}

describe('a learner who has never played', () => {
  it('may play level 1 and holds nothing', () => {
    expect(highestOpenLevel(noProgress(), 'treble')).toBe(1);
    expect(LEVELS.some((level) => isHeld(noProgress(), 'treble', level))).toBe(false);
  });

  it('has finished no session', () => {
    expect(noProgress().sessions).toBe(0);
  });
});

describe('holding a level', () => {
  it('takes twenty answers with at most two mistakes', () => {
    const learner = after(noProgress(), 'treble', 1, [...wrong(2), ...right(18)]);

    expect(isHeld(learner, 'treble', 1)).toBe(true);
    expect(highestOpenLevel(learner, 'treble')).toBe(2);
  });

  it('does not survive a third mistake', () => {
    const learner = after(noProgress(), 'treble', 1, [...wrong(3), ...right(17)]);

    expect(isHeld(learner, 'treble', 1)).toBe(false);
    expect(highestOpenLevel(learner, 'treble')).toBe(1);
  });

  it('is out of reach on nineteen answers, however good they are', () => {
    expect(isHeld(after(noProgress(), 'treble', 1, right(19)), 'treble', 1)).toBe(false);
  });

  it('forgets: twenty mistakes then twenty right answers hold the level', () => {
    const learner = after(noProgress(), 'treble', 1, [...wrong(WINDOW), ...right(WINDOW)]);

    expect(isHeld(learner, 'treble', 1)).toBe(true);
  });
});

describe('the two clefs', () => {
  it('open and hold independently, whichever one is practised', () => {
    for (const practised of CLEFS) {
      const other = CLEFS.find((clef) => clef !== practised) as Clef;
      const learner = after(noProgress(), practised, 1, right(WINDOW));

      expect(highestOpenLevel(learner, practised)).toBe(2);
      expect(highestOpenLevel(learner, other)).toBe(1);
    }
  });
});

describe('the highest open level', () => {
  it('stops at the last level there is', () => {
    expect(highestOpenLevel(holdsEverything('treble'), 'treble')).toBe(6);
  });

  it('is the first level not held, even when a higher one is', () => {
    const learner = after(holdsEverything('treble'), 'treble', 3, wrong(WINDOW));

    expect(highestOpenLevel(learner, 'treble')).toBe(3);
  });
});

describe('finished sessions', () => {
  it('are counted one by one', () => {
    const learner = sessionFinished(sessionFinished(sessionFinished(noProgress())));

    expect(learner.sessions).toBe(3);
  });

  it('are left alone by an answer', () => {
    expect(answered(sessionFinished(noProgress()), 'bass', 4, true).sessions).toBe(1);
  });
});
