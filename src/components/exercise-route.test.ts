import { describe, expect, it } from 'bun:test';

import { exerciseRoute } from '@/components/exercise-route';

describe('where starting a session goes', () => {
  it('goes to the exercise when the microphone is granted', () => {
    expect(exerciseRoute(true, { level: '3' })).toEqual({
      pathname: '/exercise',
      params: { level: '3' },
    });
  });

  it('goes to the explanation when it is not', () => {
    expect(exerciseRoute(false, { level: '3' })).toEqual({
      pathname: '/microphone',
      params: { level: '3' },
    });
  });

  it('carries the setup either way, so coming back needs no second setup', () => {
    const session = { clef: 'treble', level: '3', tempo: '60', measures: '8', metronome: 'false' };

    expect(exerciseRoute(false, session).params).toEqual(session);
  });
});
