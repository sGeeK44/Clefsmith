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
