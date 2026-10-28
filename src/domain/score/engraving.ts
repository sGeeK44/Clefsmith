import { ENGRAVING_DEFAULTS, GLYPHS } from '@/domain/score/bravura';

/**
 * The thicknesses and distances a staff is drawn with, in staff spaces.
 *
 * One staff space is the distance between two staff lines, and it is the only unit
 * the layout speaks: a staff drawn twice as large is the same numbers against a
 * larger space. SMuFL fonts publish most of these as `engravingDefaults`, which is
 * where the values come from rather than from taste.
 */
export interface Engraving {
  readonly staffLineThickness: number;
  readonly legerLineThickness: number;
  /** How far a leger line sticks out on each side of the notehead it carries. */
  readonly legerLineExtension: number;
  readonly noteheadWidth: number;
  /** Horizontal distance between two consecutive noteheads. */
  readonly noteSpacing: number;
  /** Horizontal room the clef takes before the first notehead. */
  readonly clefWidth: number;
}

/**
 * How much room the clef takes before the first notehead, and how far apart two
 * noteheads sit — both in staff spaces.
 *
 * These two are **not** SMuFL's: a font publishes how its glyphs are shaped, never
 * how far apart a score sets them. The clef allowance is the wider of the two clefs
 * plus a space of air, so neither clef touches the first note.
 */
const CLEF_GAP = 1;
const NOTE_SPACING = 3;

export const ENGRAVING: Engraving = {
  staffLineThickness: ENGRAVING_DEFAULTS.staffLineThickness,
  legerLineThickness: ENGRAVING_DEFAULTS.legerLineThickness,
  legerLineExtension: ENGRAVING_DEFAULTS.legerLineExtension,
  noteheadWidth: GLYPHS.noteheadBlack.advance,
  clefWidth: Math.max(GLYPHS.gClef.advance, GLYPHS.fClef.advance) + CLEF_GAP,
  noteSpacing: NOTE_SPACING,
};
