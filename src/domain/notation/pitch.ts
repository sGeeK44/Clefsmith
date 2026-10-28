/** The seven diatonic degrees, in the order they climb an octave from C. */
const DEGREES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const;

type Degree = (typeof DEGREES)[number];

/**
 * A pitch the staff can show: a diatonic degree and the octave it sits in.
 *
 * Octaves follow scientific pitch notation — the octave number increases between
 * `b` and the `c` above it, which is why middle C is `c4` and the note a tone below
 * it is `b3`.
 */
export interface Pitch {
  readonly degree: Degree;
  readonly octave: number;
}

/**
 * How far the pitch stands above `c0`, counted in degrees rather than semitones.
 *
 * Staff position is diatonic: `c` and `d` are one step apart on the page whether or
 * not a sharp sits between them, so the distance that matters here counts degrees.
 */
export function diatonicIndex({ degree, octave }: Pitch): number {
  return octave * DEGREES.length + DEGREES.indexOf(degree);
}
