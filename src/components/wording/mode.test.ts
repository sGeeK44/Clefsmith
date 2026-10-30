import { describe, expect, it } from 'bun:test';

import { MODES, modeOf } from '@/components/wording/mode';

describe('the exercise the parcours was entered through', () => {
  it('is the one the route names', () => {
    expect(modeOf('rhythmic-reading').label).toBe('Lecture rythmée');
  });

  it('beats time when it is the rhythmic reading, and not otherwise', () => {
    expect([modeOf('rhythmic-reading').timed, modeOf('reading').timed]).toEqual([true, false]);
  });

  it('falls back to plain reading rather than to nothing when the route says nothing', () => {
    expect(modeOf(undefined).id).toBe('reading');
  });

  it('falls back to plain reading when the route names something that is not an exercise', () => {
    expect(modeOf('solfège').id).toBe('reading');
  });

  it('offers the two readings and holds the two that are still to come', () => {
    expect(MODES.map((mode) => mode.open)).toEqual([true, true, false, false]);
  });
});
