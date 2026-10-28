import { describe, expect, it } from 'bun:test';
import { NOTATIONS, nameOf, vocabularyOf } from '@/domain/notation/naming';

describe('naming a pitch', () => {
  it('says the degree and never the octave', () => {
    expect(nameOf({ degree: 'e', octave: 4 }, 'syllabic')).toBe('mi');
    expect(nameOf({ degree: 'e', octave: 2 }, 'syllabic')).toBe('mi');
    expect(nameOf({ degree: 'e', octave: 4 }, 'letters')).toBe('E');
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
