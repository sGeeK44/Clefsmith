import type { Clef } from '@/domain/notation/clef';
import { staffPosition } from '@/domain/notation/clef';
import type { Pitch } from '@/domain/notation/pitch';
import type { Engraving } from '@/domain/score/engraving';

/**
 * A glyph the layout asks for by name. The name is SMuFL's; what it maps to is the
 * glyph table's business, and no layout rule is allowed to depend on it.
 */
type GlyphName = 'gClef' | 'fClef' | 'noteheadBlack';

/**
 * Where a glyph goes, in staff spaces measured from the bottom line of the staff.
 *
 * `y` grows upwards, like the staff itself and like SMuFL's own coordinates. Turning
 * that into screen pixels is the painter's job and nothing else's.
 */
interface GlyphPlacement {
  readonly glyph: GlyphName;
  readonly x: number;
  readonly y: number;
  readonly current: boolean;
}

interface LineSegment {
  readonly from: number;
  readonly to: number;
  readonly y: number;
  readonly thickness: number;
}

export interface StaffLayout {
  readonly glyphs: readonly GlyphPlacement[];
  readonly lines: readonly LineSegment[];
  readonly width: number;
}

/** The staff is five lines; a clef nails its own pitch to one of them. */
const LINES = 5;
const TOP_POSITION = (LINES - 1) * 2;

const CLEF_GLYPHS: Record<Clef, GlyphName> = { treble: 'gClef', bass: 'fClef' };

export interface Note {
  readonly pitch: Pitch;
  readonly current: boolean;
}

export function layoutStaff(clef: Clef, notes: readonly Note[], engraving: Engraving): StaffLayout {
  const positions = notes.map((note) => staffPosition(clef, note.pitch));
  const width = engraving.clefWidth + notes.length * engraving.noteSpacing;

  return {
    width,
    glyphs: [
      clefGlyph(clef),
      ...notes.map((note, index) => notehead(note, positions[index] as number, index, engraving)),
    ],
    lines: [
      ...staffLines(width, engraving),
      ...positions.flatMap((position, index) => legerLines(position, index, engraving)),
    ],
  };
}

function clefGlyph(clef: Clef): GlyphPlacement {
  return { glyph: CLEF_GLYPHS[clef], x: 0, y: anchorOf(clef), current: false };
}

/**
 * A SMuFL clef glyph is drawn from the line it names, so the clef sits where the
 * pitch it fixes sits.
 */
function anchorOf(clef: Clef): number {
  return (
    staffPosition(
      clef,
      clef === 'treble' ? { degree: 'g', octave: 4 } : { degree: 'f', octave: 3 },
    ) / 2
  );
}

function notehead(
  note: Note,
  position: number,
  index: number,
  engraving: Engraving,
): GlyphPlacement {
  return {
    glyph: 'noteheadBlack',
    x: noteX(index, engraving),
    y: position / 2,
    current: note.current,
  };
}

function noteX(index: number, engraving: Engraving): number {
  return engraving.clefWidth + index * engraving.noteSpacing;
}

function staffLines(width: number, engraving: Engraving): LineSegment[] {
  return Array.from({ length: LINES }, (_, line) => ({
    from: 0,
    to: width,
    y: line,
    thickness: engraving.staffLineThickness,
  }));
}

/**
 * One leger line per line position the note reaches past the staff, the note's own
 * included. A note in the space just outside the staff reaches none.
 */
function legerLines(position: number, index: number, engraving: Engraving): LineSegment[] {
  const outside = position > TOP_POSITION ? position - TOP_POSITION : Math.min(position, 0);
  const x = noteX(index, engraving);
  const half = engraving.noteheadWidth / 2 + engraving.legerLineExtension;

  return Array.from({ length: Math.floor(Math.abs(outside) / 2) }, (_, step) => ({
    from: x - half,
    to: x + half,
    y: (position > TOP_POSITION ? TOP_POSITION + (step + 1) * 2 : -(step + 1) * 2) / 2,
    thickness: engraving.legerLineThickness,
  }));
}
