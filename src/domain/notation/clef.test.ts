import { describe, expect, it } from 'bun:test';
import { staffPosition } from '@/domain/notation/clef';

describe('a pitch on a staff', () => {
  it('sits on the second line when it is the pitch the treble clef names', () => {
    expect(staffPosition('treble', { degree: 'g', octave: 4 })).toBe(2);
  });

  it('sits on the fourth line when it is the pitch the bass clef names', () => {
    expect(staffPosition('bass', { degree: 'f', octave: 3 })).toBe(6);
  });

  it('reaches the top line of the treble staff at f5', () => {
    expect(staffPosition('treble', { degree: 'f', octave: 5 })).toBe(8);
  });

  it('falls below the treble staff at c4', () => {
    expect(staffPosition('treble', { degree: 'c', octave: 4 })).toBe(-2);
  });

  it('rises above the bass staff at c4', () => {
    expect(staffPosition('bass', { degree: 'c', octave: 4 })).toBe(10);
  });

  it('moves one half-space between two neighbouring degrees', () => {
    const e4 = staffPosition('treble', { degree: 'e', octave: 4 });
    const f4 = staffPosition('treble', { degree: 'f', octave: 4 });

    expect(f4 - e4).toBe(1);
  });

  it('crosses the octave between b and the c above it', () => {
    const b3 = staffPosition('treble', { degree: 'b', octave: 3 });
    const c4 = staffPosition('treble', { degree: 'c', octave: 4 });

    expect(c4 - b3).toBe(1);
  });

  it('places the same pitch twelve half-spaces apart in the two clefs', () => {
    const treble = staffPosition('treble', { degree: 'c', octave: 4 });
    const bass = staffPosition('bass', { degree: 'c', octave: 4 });

    expect(bass - treble).toBe(12);
  });
});
