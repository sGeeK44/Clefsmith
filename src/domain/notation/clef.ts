import { diatonicIndex, type Pitch, pitchAt } from '@/domain/notation/pitch';

export const CLEFS = ['treble', 'bass'] as const;

export type Clef = (typeof CLEFS)[number];

/**
 * The pitch each clef nails to a line, and which line that is.
 *
 * A clef says nothing else about the staff: once one pitch is fixed, every other
 * follows from the diatonic distance to it. `position` counts half-spaces from the
 * bottom line, so the five lines sit at 0, 2, 4, 6 and 8.
 */
const ANCHORS: Record<Clef, { readonly pitch: Pitch; readonly position: number }> = {
  treble: { pitch: { degree: 'g', octave: 4 }, position: 2 },
  bass: { pitch: { degree: 'f', octave: 3 }, position: 6 },
};

/**
 * Where the pitch sits, in half-spaces counted from the bottom line of the staff.
 *
 * Negative below the staff, above 8 beyond the top line. The unit is half a space
 * because that is the distance between two neighbouring degrees: one sits on a line,
 * the next in the space above it.
 */
export function staffPosition(clef: Clef, pitch: Pitch): number {
  const anchor = ANCHORS[clef];
  return anchor.position + (diatonicIndex(pitch) - diatonicIndex(anchor.pitch));
}

/** The pitch a clef reads at `position`, which is where `staffPosition` came from. */
export function pitchOn(clef: Clef, position: number): Pitch {
  const anchor = ANCHORS[clef];
  return pitchAt(diatonicIndex(anchor.pitch) + (position - anchor.position));
}
