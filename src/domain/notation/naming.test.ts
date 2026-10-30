import { describe, expect, it } from 'bun:test';
import { degreeOf, NOTATIONS, nameOf, vocabularyOf } from '@/domain/notation/naming';
import { DEGREES } from '@/domain/notation/pitch';

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

describe('reading a name back', () => {
  it('finds the degree every name of every notation stands for', () => {
    for (const notation of NOTATIONS) {
      for (const degree of DEGREES) {
        expect(degreeOf(nameOf(degree, notation), notation)).toBe(degree);
      }
    }
  });

  it('finds nothing for a word that is not a name', () => {
    expect(degreeOf('bonjour', 'syllabic')).toBeUndefined();
  });

  it('finds nothing for a name read in the other notation', () => {
    expect(degreeOf('do', 'letters')).toBeUndefined();
    expect(degreeOf('C', 'syllabic')).toBeUndefined();
  });

  it('finds nothing in an empty answer, which is what silence comes back as', () => {
    expect(degreeOf('', 'syllabic')).toBeUndefined();
  });
});
