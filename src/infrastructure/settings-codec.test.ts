import { describe, expect, it } from 'bun:test';
import { defaultSettings } from '@/domain/settings';
import { decode, encode } from '@/infrastructure/settings-codec';

describe('the settings a learner has written down', () => {
  it('reads back what was written', () => {
    expect(decode(encode({ notation: 'letters' }))).toEqual({ notation: 'letters' });
  });

  it('names the notes in syllables when nothing was ever written', () => {
    expect(decode(null)).toEqual({ notation: 'syllabic' });
  });

  it('names the notes in syllables when the record is not JSON', () => {
    expect(decode('{ notation:')).toEqual(defaultSettings());
  });

  it('names the notes in syllables when the record carries another schema', () => {
    expect(decode(JSON.stringify({ schema: 2, notation: 'letters' }))).toEqual(defaultSettings());
  });

  it('names the notes in syllables when the record names a notation this version has not', () => {
    expect(decode(JSON.stringify({ schema: 1, notation: 'tonic sol-fa' }))).toEqual(
      defaultSettings(),
    );
  });

  it('writes the schema number down, without which nothing could be read back', () => {
    expect(JSON.parse(encode({ notation: 'letters' }))).toEqual({ schema: 1, notation: 'letters' });
  });
});
