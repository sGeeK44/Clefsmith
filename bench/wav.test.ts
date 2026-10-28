import { describe, expect, it } from 'bun:test';

import { decodeWav } from '@/infrastructure/wav-corpus-audio';
import { encodeWav } from './wav';

describe('encodeWav', () => {
  it('writes samples the corpus decoder reads back unchanged', () => {
    const samples = Int16Array.from([0, 1, -1, 32_767, -32_768, 4_242]);

    const decoded = decodeWav(encodeWav(samples, 16_000), 16_000, 'round-trip.wav');

    expect(Array.from(decoded)).toEqual(Array.from(samples));
  });

  it('declares the rate it was given, so a file at another rate is refused', () => {
    const encoded = encodeWav(Int16Array.from([7]), 8_000);

    expect(() => decodeWav(encoded, 16_000, 'wrong-rate.wav')).toThrow();
  });
});
