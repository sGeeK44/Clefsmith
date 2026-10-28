import type { Clef } from '@/domain/notation/clef';
import { staffPosition } from '@/domain/notation/clef';
import type { Pitch } from '@/domain/notation/pitch';
import type { Engraving } from '@/domain/score/engraving';
import type { GlyphName, Glyphs } from '@/domain/score/glyph';

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

interface Point {
  readonly x: number;
  readonly y: number;
}

interface LineSegment {
  readonly from: Point;
  readonly to: Point;
  readonly thickness: number;
  /** True when the segment belongs to the current note, like its notehead. */
  readonly current: boolean;
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

/**
 * The middle line, in half-spaces. A notehead on it or above it takes a downward
 * stem, so that a stem never leaves the staff on the side the note already did.
 */
const MIDDLE_POSITION = TOP_POSITION / 2;

/** How far a stem reaches from the notehead it leaves, in staff spaces. */
const STEM_LENGTH = 3.5;

export interface Note {
  readonly pitch: Pitch;
  readonly current: boolean;
}

export function layoutStaff(
  clef: Clef,
  notes: readonly Note[],
  engraving: Engraving,
  glyphs: Glyphs,
): StaffLayout {
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
      ...notes.flatMap((note, index) =>
        legerLines(positions[index] as number, index, note.current, engraving),
      ),
      ...notes.map((note, index) =>
        stem(positions[index] as number, index, note.current, engraving, glyphs),
      ),
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
    from: { x: 0, y: line },
    to: { x: width, y: line },
    thickness: engraving.staffLineThickness,
    current: false,
  }));
}

/**
 * The stem leaves the notehead at the anchor the font publishes for it — the upper
 * right corner going up, the lower left going down — so the two meet without a gap
 * whatever the notehead is shaped like.
 */
function stem(
  position: number,
  index: number,
  current: boolean,
  engraving: Engraving,
  glyphs: Glyphs,
): LineSegment {
  const up = position < MIDDLE_POSITION;
  const anchor = up ? glyphs.noteheadBlack.stemUp : glyphs.noteheadBlack.stemDown;
  const foot = {
    x: noteX(index, engraving) + (anchor?.x ?? 0),
    y: position / 2 + (anchor?.y ?? 0),
  };

  return {
    from: foot,
    to: { x: foot.x, y: foot.y + (up ? STEM_LENGTH : -STEM_LENGTH) },
    thickness: engraving.stemThickness,
    current,
  };
}

/**
 * One leger line per line position the note reaches past the staff, the note's own
 * included. A note in the space just outside the staff reaches none.
 */
function legerLines(
  position: number,
  index: number,
  current: boolean,
  engraving: Engraving,
): LineSegment[] {
  const outside = position > TOP_POSITION ? position - TOP_POSITION : Math.min(position, 0);
  const x = noteX(index, engraving);
  const half = engraving.noteheadWidth / 2 + engraving.legerLineExtension;

  return Array.from({ length: Math.floor(Math.abs(outside) / 2) }, (_, step) => {
    const y = (position > TOP_POSITION ? TOP_POSITION + (step + 1) * 2 : -(step + 1) * 2) / 2;

    return {
      from: { x: x - half, y },
      to: { x: x + half, y },
      thickness: engraving.legerLineThickness,
      current,
    };
  });
}
