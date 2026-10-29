import { describe, expect, it } from 'bun:test';
import { STUDIES, tempoOf } from '@/components/wording/study';
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
