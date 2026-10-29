import { describe, expect, it } from 'bun:test';
import { NOTATIONS, nameOf, vocabularyOf } from '@/domain/notation/naming';

describe('naming a degree', () => {
  it('says the same word in every octave the degree appears in', () => {
    expect(nameOf('e', 'syllabic')).toBe('mi');
    expect(nameOf('e', 'letters')).toBe('E');
  });

  it('names the seven degrees in syllabic notation', () => {
    expect(vocabularyOf('syllabic')).toEqual(['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si']);
  });

  it('names the seven degrees in letter notation', () => {
    expect(vocabularyOf('letters')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('gives each notation seven distinct words', () => {
    for (const notation of NOTATIONS) {
      expect(new Set(vocabularyOf(notation)).size).toBe(7);
    }
  });
});
