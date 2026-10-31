import { describe, expect, it } from 'bun:test';

import type { Degree } from '@/domain/notation/pitch';
import { type Answer, noProgress, type Progress } from '@/domain/training/progress';
import { reportOf } from '@/domain/training/report';

/** A reading where the named degrees were missed and everything else was right. */
function reading(right: number, missed: readonly Degree[]): readonly Answer[] {
  return [
    ...Array.from({ length: right }, () => ({ degree: 'c' as Degree, correct: true })),
    ...missed.map((degree) => ({ degree, correct: false })),
  ];
}

const onStudy = (level: 1 | 2 | 3 | 4 | 5 | 6): Progress => ({
  ...noProgress(),
  level: { treble: level, bass: 1 },
});

describe('the report of a finished session', () => {
  it('counts accuracy over attempts, which is what a reading leaves behind', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(32, ['d', 'd', 'g', 'g']),
    });

    expect(report.accuracy).toBe(89);
  });

  it('names at most three notes to go back over, most missed first', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(10, ['d', 'e', 'e', 'f', 'f', 'f', 'g', 'g', 'g', 'g']),
    });

    expect(report.missed).toEqual([
      { degree: 'g', times: 4 },
      { degree: 'f', times: 3 },
      { degree: 'e', times: 2 },
    ]);
  });

  it('breaks a tie by the order the degrees climb an octave', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(10, ['g', 'd', 'e']),
    });

    expect(report.missed.map((miss) => miss.degree)).toEqual(['d', 'e', 'g']);
  });

  it('names nothing when the session was read clean', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(16, []),
    });

    expect(report.missed).toEqual([]);
  });

  it('announces the study a passed session opened', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(16, []),
    });

    expect(report.opened).toBe(4);
  });

  it('announces nothing when the session fell short of the mark', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(10, ['d', 'd', 'd', 'd']),
    });

    expect(report.opened).toBeUndefined();
  });

  it('announces nothing after a targeted revision, however well it was read', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: true,
      answers: reading(16, []),
    });

    expect(report.opened).toBeUndefined();
  });

  it('reports how much of a beaten session fell on the beat', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: [
        { degree: 'c', correct: true, timing: 'in-time' },
        { degree: 'c', correct: true, timing: 'off-beat' },
      ],
    });

    expect(report.onTime).toBe(50);
  });

  it('reports no timing at all for a session read at the learner\u2019s own pace', () => {
    const report = reportOf(onStudy(3), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(16, []),
    });

    expect(report.onTime).toBeUndefined();
  });

  it('announces nothing when the study replayed is one the learner has left behind', () => {
    const report = reportOf(onStudy(5), {
      clef: 'treble',
      level: 3,
      review: false,
      answers: reading(16, []),
    });

    expect(report.opened).toBeUndefined();
  });
});
