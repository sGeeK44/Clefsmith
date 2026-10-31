import { describe, expect, it } from 'bun:test';

import { oneOf } from '@/core/one-of';

const CLEFS = ['treble', 'bass'] as const;
const LEVELS = [1, 2, 3, 4, 5, 6] as const;

describe('reading a string into one of a declared few', () => {
  it('gives back the member the text names', () => {
    expect(oneOf(CLEFS, 'bass')).toBe('bass');
  });

  it('reads a number written down as a string', () => {
    expect(oneOf(LEVELS, '3')).toBe(3);
  });

  it('refuses a text that names none of them', () => {
    expect(oneOf(CLEFS, 'alto')).toBeUndefined();
  });

  it('refuses a number outside the few, rather than passing it through', () => {
    expect(oneOf(LEVELS, '7')).toBeUndefined();
  });

  /** `Number('')` is 0, and 0 is not a level — the empty string is the one that crashed a screen. */
  it('refuses nothing at all', () => {
    expect(oneOf(LEVELS, '')).toBeUndefined();
    expect(oneOf(CLEFS, '')).toBeUndefined();
  });

  it('refuses a parameter the route never carried', () => {
    expect(oneOf(LEVELS, undefined)).toBeUndefined();
  });

  /** A list of numbers is matched by value, so the decimal spelling of one still names it. */
  it('reads a number the long way round', () => {
    expect(oneOf(LEVELS, '3.0')).toBe(3);
  });

  it('refuses text that merely starts with a number', () => {
    expect(oneOf(LEVELS, '3x')).toBeUndefined();
  });

  /**
   * `Number` reads far more than a decimal figure, and each of these would
   * otherwise arrive as a level nobody wrote.
   */
  it('refuses a number padded with space', () => {
    expect(oneOf(LEVELS, ' 3 ')).toBeUndefined();
  });

  it('refuses a number written in another base', () => {
    expect(oneOf(LEVELS, '0x3')).toBeUndefined();
  });

  it('refuses a number written in exponent form', () => {
    expect(oneOf(LEVELS, '3e0')).toBeUndefined();
  });
});
