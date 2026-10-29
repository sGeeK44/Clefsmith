import { describe, expect, it } from 'bun:test';
import { broughtLine, clefName, STUDIES, studyLine, tempoOf } from '@/components/wording/study';
import { LEVELS } from '@/domain/training/level';

describe('what a level is called on screen', () => {
  it('names the six in the order they are climbed', () => {
    expect(LEVELS.map(tempoOf)).toEqual([
      'Largo',
      'Adagio',
      'Andante',
      'Moderato',
      'Allegro',
      'Presto',
    ]);
  });

  it('counts as many studies as the domain has levels', () => {
    expect(STUDIES).toBe(LEVELS.length);
  });
});

describe('the line under a study', () => {
  it('names the three notes the first one brings', () => {
    expect(studyLine(1, 'syllabic')).toBe('Étude 1 · Do, Ré, Mi');
  });

  it('names them in the notation the learner chose', () => {
    expect(studyLine(1, 'letters')).toBe('Étude 1 · C, D, E');
  });

  it('names only the two a later study adds, not the whole pool', () => {
    expect(studyLine(4, 'syllabic')).toBe('Étude 4 · Do, Ré');
  });

  it('says nothing after the number when the study brings no note of its own', () => {
    expect(studyLine(6, 'syllabic')).toBe('Étude 6');
  });
});

describe('what a study brings, in words', () => {
  it('counts the notes it adds', () => {
    expect(broughtLine('treble', 2)).toBe('2 nouvelles notes');
  });

  it('says review where a study adds nothing', () => {
    expect(broughtLine('treble', 6)).toBe('Révision');
  });

  it('counts the three the first study opens with', () => {
    expect(broughtLine('treble', 1)).toBe('3 nouvelles notes');
  });

  it('counts each clef on its own, where the two differ', () => {
    expect(broughtLine('treble', 5)).toBe('6 nouvelles notes');
    expect(broughtLine('bass', 5)).toBe('4 nouvelles notes');
  });
});

describe('what a clef is called', () => {
  it('names both', () => {
    expect([clefName('treble'), clefName('bass')]).toEqual(['Clé de sol', 'Clé de fa']);
  });
});
