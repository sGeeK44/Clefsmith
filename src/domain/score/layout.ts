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
  readonly shade: Shade;
}

/**
 * How a note is to be drawn — what the reading has made of it.
 *
 * It is not the drill's `Mark`: a mark says what an answer was worth, and three
 * of these five are not answers at all. The layout knows nothing about answers;
 * it knows that a note is drawn one of five ways, and the screen decides which.
 */
export type Shade = 'ahead' | 'current' | 'ok' | 'late' | 'wrong';

interface Point {
  readonly x: number;
  readonly y: number;
}

interface LineSegment {
  readonly from: Point;
  readonly to: Point;
  readonly thickness: number;
  /** The shade of the note the segment belongs to — its stem, its leger lines. */
  readonly shade: Shade;
}

export interface StaffLayout {
  readonly glyphs: readonly GlyphPlacement[];
  readonly lines: readonly LineSegment[];
  readonly width: number;
  /**
   * How far the drawing reaches above and below the bottom line, ink included.
   *
   * A painter that sized its canvas by the staff alone would clip a clef, which
   * reaches further than any note, and leger lines, which reach further still.
   */
  readonly top: number;
  readonly bottom: number;
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
  readonly shade: Shade;
}

/**
 * How a staff is divided into measures, when it is one.
 *
 * Optional, because not every staff is a reading: the desk and the parcours draw
 * the notes a study is made of, and a barline across a pool of notes would claim
 * a rhythm nobody is reading.
 */
export interface Barring {
  /** How many notes to a measure. A barline follows each one. */
  readonly every: number;
  /** Whether what is drawn is the end of the piece, which takes a double barline. */
  readonly ends: boolean;
}

export function layoutStaff(
  clef: Clef,
  notes: readonly Note[],
  engraving: Engraving,
  glyphs: Glyphs,
  barring?: Barring,
): StaffLayout {
  const positions = notes.map((note) => staffPosition(clef, note.pitch));
  const width = engraving.clefWidth + notes.length * engraving.noteSpacing;

  const placed = [
    clefGlyph(clef),
    ...notes.map((note, index) => notehead(note, positions[index] as number, index, engraving)),
  ];
  const lines = [
    ...staffLines(width, engraving),
    ...notes.flatMap((note, index) =>
      legerLines(positions[index] as number, index, note.shade, engraving),
    ),
    ...notes.map((note, index) =>
      stem(positions[index] as number, index, note.shade, engraving, glyphs),
    ),
    ...barlines(notes.length, engraving, barring),
  ];
  const reach = [
    ...lines.flatMap((line) => [line.from.y, line.to.y]),
    ...placed.flatMap((glyph) => [
      glyph.y + glyphs[glyph.glyph].top,
      glyph.y + glyphs[glyph.glyph].bottom,
    ]),
  ];

  return {
    width,
    glyphs: placed,
    lines,
    top: Math.max(...reach),
    bottom: Math.min(...reach),
  };
}

function clefGlyph(clef: Clef): GlyphPlacement {
  return { glyph: CLEF_GLYPHS[clef], x: 0, y: anchorOf(clef), shade: 'ahead' };
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
    shade: note.shade,
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
    shade: 'ahead',
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
  shade: Shade,
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
    shade,
  };
}

/**
 * One leger line per line position the note reaches past the staff, the note's own
 * included. A note in the space just outside the staff reaches none.
 */
function legerLines(
  position: number,
  index: number,
  shade: Shade,
  engraving: Engraving,
): LineSegment[] {
  const outside = position > TOP_POSITION ? position - TOP_POSITION : Math.min(position, 0);
  /** The notehead is drawn from its left edge, so its centre is half a head further on. */
  const x = noteX(index, engraving) + engraving.noteheadWidth / 2;
  const half = engraving.noteheadWidth / 2 + engraving.legerLineExtension;

  return Array.from({ length: Math.floor(Math.abs(outside) / 2) }, (_, step) => {
    const y = (position > TOP_POSITION ? TOP_POSITION + (step + 1) * 2 : -(step + 1) * 2) / 2;

    return {
      from: { x: x - half, y },
      to: { x: x + half, y },
      thickness: engraving.legerLineThickness,
      shade,
    };
  });
}

/**
 * A barline after every measure, and a thick one closing the piece.
 *
 * The lines fall **between** two noteheads rather than on the second: a barline
 * drawn on a note is a barline the note has to be read through. The last measure
 * of a staff is closed like any other unless the piece ends there, where SMuFL's
 * final barline — thin, a gap, thick — says that it does.
 */
function barlines(
  count: number,
  engraving: Engraving,
  barring: Barring | undefined,
): LineSegment[] {
  if (barring === undefined) {
    return [];
  }

  const measures = Math.ceil(count / barring.every);

  return Array.from({ length: measures }, (_, measure) => {
    const notes = Math.min((measure + 1) * barring.every, count);
    const x = engraving.clefWidth + notes * engraving.noteSpacing - engraving.noteSpacing / 2;
    const last = measure === measures - 1;

    return last && barring.ends ? ending(x, engraving) : [bar(x, engraving.thinBarlineThickness)];
  }).flat();
}

function ending(x: number, engraving: Engraving): LineSegment[] {
  const thin = engraving.thinBarlineThickness;
  const thick = engraving.thickBarlineThickness;
  const gap = engraving.barlineSeparation;

  return [bar(x - gap - thick / 2 - thin / 2, thin), bar(x, thick)];
}

/** A barline spans the staff and nothing more: it is not a note and carries no shade. */
function bar(x: number, thickness: number): LineSegment {
  return {
    from: { x, y: 0 },
    to: { x, y: TOP_POSITION / 2 },
    thickness,
    shade: 'ahead',
  };
}
