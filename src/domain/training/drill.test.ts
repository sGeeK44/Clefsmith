import { describe, expect, it } from 'bun:test';
import type { Degree, Pitch } from '@/domain/notation/pitch';
import { answered, drillOf, expectedOf, isOver } from '@/domain/training/drill';
import { accuracyOf } from '@/domain/training/progress';

/** Five notes: one whole measure of four, and the first note of the next. */
const NOTES: readonly Pitch[] = [
  { degree: 'c', octave: 4 },
  { degree: 'd', octave: 4 },
  { degree: 'e', octave: 4 },
  { degree: 'f', octave: 4 },
  { degree: 'g', octave: 4 },
];

function reading(said: readonly Degree[]) {
  return said.reduce(answered, drillOf(NOTES));
}

describe('a session being read', () => {
  it('asks for its first note, and nothing has been answered', () => {
    const drill = drillOf(NOTES);

    expect(expectedOf(drill)).toEqual({ degree: 'c', octave: 4 });
    expect(drill.answers).toEqual([]);
    expect(isOver(drill)).toBe(false);
  });

  it('moves on to the next note when the shown one is named', () => {
    expect(expectedOf(reading(['c']))).toEqual({ degree: 'd', octave: 4 });
  });

  it('records what was named against what was shown', () => {
    expect(reading(['c', 'a']).last).toEqual({ said: 'a', expected: 'd', right: false });
  });

  it('sends a mistake back to the start of the measure, notes already read included', () => {
    expect(expectedOf(reading(['c', 'd', 'a']))).toEqual({ degree: 'c', octave: 4 });
  });

  it('leaves a mistake on the first note of a measure exactly where it is', () => {
    expect(expectedOf(reading(['c', 'd', 'e', 'f', 'a']))).toEqual({ degree: 'g', octave: 4 });
  });

  it('counts a mistake as an attempt on the note that was shown', () => {
    expect(reading(['c', 'a']).answers).toEqual([
      { degree: 'c', correct: true },
      { degree: 'd', correct: false },
    ]);
  });

  it('is over once the last note has been read right, and asks for nothing more', () => {
    const drill = reading(['c', 'd', 'e', 'f', 'g']);

    expect(isOver(drill)).toBe(true);
    expect(expectedOf(drill)).toBeUndefined();
  });

  it('answers nothing more once it is over', () => {
    const over = reading(['c', 'd', 'e', 'f', 'g']);

    expect(answered(over, 'c')).toBe(over);
  });

  it('counts accuracy over attempts, so a re-read measure costs what it cost', () => {
    const drill = reading(['c', 'd', 'a', 'c', 'd', 'e', 'f', 'g']);

    expect(drill.answers).toHaveLength(8);
    expect(accuracyOf(drill.answers)).toBe(88);
  });
});
