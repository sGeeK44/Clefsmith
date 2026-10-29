import { describe, expect, it } from 'bun:test';
import { defaultSettings } from '@/domain/settings';
import { decode, encode } from '@/infrastructure/settings-codec';

describe('the settings a learner has written down', () => {
  it('reads back what was written', () => {
    expect(decode(encode({ notation: 'letters', welcomed: true }))).toEqual({
      notation: 'letters',
      welcomed: true,
    });
  });

  it('reads in a learner who has chosen nothing and seen nothing', () => {
    expect(decode(null)).toEqual({ notation: 'syllabic', welcomed: false });
  });

  it('names the notes in syllables when the record is not JSON', () => {
    expect(decode('{ notation:')).toEqual(defaultSettings());
  });

  it('names the notes in syllables when the record carries another schema', () => {
    expect(decode(JSON.stringify({ schema: 1, notation: 'letters' }))).toEqual(defaultSettings());
  });

  it('names the notes in syllables when the record names a notation this version has not', () => {
    expect(decode(JSON.stringify({ schema: 2, notation: 'tonic sol-fa', welcomed: true }))).toEqual(
      defaultSettings(),
    );
  });

  it('reads in a new learner when the record says nothing about the introduction', () => {
    expect(decode(JSON.stringify({ schema: 2, notation: 'letters' }))).toEqual(defaultSettings());
  });

  it('writes the schema number down, without which nothing could be read back', () => {
    expect(JSON.parse(encode({ notation: 'letters', welcomed: true }))).toEqual({
      schema: 2,
      notation: 'letters',
      welcomed: true,
    });
  });
});
