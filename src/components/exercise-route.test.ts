import { describe, expect, it } from 'bun:test';

import { briefOf, exerciseRoute } from '@/components/exercise-route';

describe('where starting a session goes', () => {
  it('goes to the exercise when the microphone is granted', () => {
    expect(exerciseRoute('granted', { level: '3' })).toEqual({
      pathname: '/exercise',
      params: { level: '3' },
    });
  });

  it('goes to the explanation on either refusal', () => {
    for (const refused of ['askable', 'blocked'] as const) {
      expect(exerciseRoute(refused, { level: '3' })).toEqual({
        pathname: '/microphone',
        params: { level: '3' },
      });
    }
  });

  it('carries the setup either way, so coming back needs no second setup', () => {
    const session = { clef: 'treble', level: '3', tempo: '60', measures: '8', metronome: 'false' };

    expect(exerciseRoute('blocked', session).params).toEqual(session);
  });
});

describe('reading a session back out of its route', () => {
  const session = { clef: 'treble', level: '3', measures: '8', degrees: '' };

  it('reads back what the route was given', () => {
    expect(briefOf(session)).toEqual({
      clef: 'treble',
      level: 3,
      measures: 8,
      degrees: [],
    });
  });

  it('reads the degrees a targeted review carries', () => {
    expect(briefOf({ ...session, degrees: 'c,e' })?.degrees).toEqual(['c', 'e']);
  });

  /**
   * The route is typed, not checked: anything can arrive on it — a deep link, a
   * stale link, a version that spelled a parameter differently. A brief built
   * out of what did not arrive used to reach the domain as level zero, which is
   * no level, and the staff was laid out against a range that does not exist.
   */
  it('refuses a route that carries no level, rather than inventing one', () => {
    expect(briefOf({ ...session, level: undefined })).toBeUndefined();
  });

  it('refuses a level outside the six', () => {
    expect(briefOf({ ...session, level: '7' })).toBeUndefined();
  });

  it('refuses a clef that is not one of ours', () => {
    expect(briefOf({ ...session, clef: 'alto' })).toBeUndefined();
  });

  it('refuses a session length nobody offers', () => {
    expect(briefOf({ ...session, measures: '5' })).toBeUndefined();
  });

  it('refuses a degree that names no note', () => {
    expect(briefOf({ ...session, degrees: 'c,h' })).toBeUndefined();
  });

  it('takes a route with no degrees at all as a session of the whole level', () => {
    expect(briefOf({ ...session, degrees: undefined })?.degrees).toEqual([]);
  });
});
