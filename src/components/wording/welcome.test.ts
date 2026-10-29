import { describe, expect, it } from 'bun:test';
import { STARTS, STEPS, suggested } from '@/components/wording/welcome';

describe('the introduction', () => {
  it('walks three steps, and asks for the microphone only on the last', () => {
    expect(STEPS.map((step) => step.cta)).toEqual(['Continuer', 'Continuer', 'Autoriser le micro']);
  });

  it('offers a start for each step of the ladder it names', () => {
    expect(STARTS.map((start) => start.level)).toEqual([1, 3, 5]);
  });

  it('suggests neither the beginner nor the fluent reader', () => {
    expect(suggested()).toBe(3);
  });
});
