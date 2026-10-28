/**
 * A glyph the layout asks for by name. The name is SMuFL's; what it maps to is the
 * table's business, and no layout rule is allowed to depend on it.
 */
export type GlyphName = 'gClef' | 'fClef' | 'noteheadBlack';

interface Anchor {
  readonly x: number;
  readonly y: number;
}

/**
 * What the layout needs to know about a glyph to place it, in staff spaces.
 *
 * Adding a flag, a rest or a beam adds a name above and an entry in the table —
 * never a branch in the layout.
 */
export interface Glyph {
  /** The SMuFL codepoint, as the string a font lookup wants. */
  readonly codepoint: string;
  readonly advance: number;
  /** How far the ink reaches above and below the origin. */
  readonly top: number;
  readonly bottom: number;
  /** Where an upward stem leaves the glyph, measured from its origin. */
  readonly stemUp?: Anchor;
  /** Where a downward stem leaves the glyph. */
  readonly stemDown?: Anchor;
}

export type Glyphs = Readonly<Record<GlyphName, Glyph>>;
