/**
 * The vocabulary every screen styles itself with.
 *
 * A token is named by the role it plays — `ink`, `muted`, `line` — never by the
 * colour it happens to be. A screen that knows `#1f1c17` cannot follow the
 * system setting; a screen that knows `ink` follows it for free.
 *
 * Colours are stored as `#rrggbb`. The mockup states the status colours in
 * `oklch()`, which older Android versions do not parse, so each one is
 * converted once and its source kept in the comment beside it — without the
 * `oklch` nobody can re-derive the dark variant.
 */

export interface Colors {
  /** The page behind everything. */
  readonly bg: string;
  /** A card or a sheet raised above the page. */
  readonly surf: string;
  /** The staff sits on this one. */
  readonly canvas: string;
  /** Body text. */
  readonly ink: string;
  /** Secondary text. */
  readonly muted: string;
  /** Borders. */
  readonly line: string;
  /** A fill that separates without drawing a border. */
  readonly soft: string;
  /** The one colour that asks to be acted on. */
  readonly accent: string;
  /** A right answer. */
  readonly ok: string;
  /** A right answer played off the beat. */
  readonly late: string;
  /** A wrong answer. */
  readonly bad: string;
}

interface Theme {
  readonly colors: Colors;
  readonly spacing: Readonly<Record<'xs' | 's' | 'm' | 'l' | 'xl', number>>;
  readonly radii: Readonly<Record<'s' | 'm' | 'l' | 'xl' | 'pill', number>>;
  readonly typography: {
    readonly family: Readonly<
      Record<'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'music', string>
    >;
    readonly size: Readonly<Record<'caption' | 'body' | 'title' | 'display', number>>;
  };
}

/** Shared by both themes: a rhythm does not change with the light. */
const spacing = { xs: 4, s: 8, m: 16, l: 24, xl: 40 } as const;
/**
 * The four corners the mockup draws, and the pill.
 *
 * `s` is a bar or a dot, `m` a pad or a segment, `l` a button, `xl` a card. They
 * are the mockup's own numbers rather than a geometric progression: the step
 * from a segment to a card is what the eye reads as "this is a surface", and a
 * ladder that happens to be regular would move it.
 *
 * The segmented `Choice` wants an inner corner for the raised option, and takes
 * it as `m` less its lip — which lands on the mockup's own 11 without anyone
 * having to write 11 down twice.
 */
const radii = { s: 6, m: 14, l: 18, xl: 22, pill: 999 } as const;
const typography = {
  family: {
    light: 'Outfit_300Light',
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
    /**
     * The font the musical glyphs of a label are drawn in.
     *
     * iOS draws some of the Unicode musical symbols and not others — the clef
     * yes, the rests no — so a glyph picked for a label renders on one device
     * and boxes on another. This is the mockup's own font, and unlike Bravura
     * — which is an engraving font and sets its glyphs on a staff's baseline —
     * it is cut to sit on a line of text.
     */
    music: 'NotoMusic-Regular',
  },
  size: { caption: 13, body: 16, title: 22, display: 34 },
} as const;

/** The mockup's palette, read off it as-is. */
const light: Theme = {
  colors: {
    bg: '#f5f1e8',
    surf: '#fffcf6',
    canvas: '#e2dccf',
    ink: '#1f1c17',
    muted: '#736c60',
    line: '#e4ddcf',
    soft: '#ebe5d8',
    accent: '#346aac', // oklch(0.52 0.12 255)
    ok: '#33854a', // oklch(0.55 0.12 150)
    late: '#b37903', // oklch(0.62 0.13 75)
    bad: '#c43f3e', // oklch(0.56 0.17 25)
  },
  spacing,
  radii,
  typography,
};

/**
 * The mockup's own dark palette, read off it as-is.
 *
 * `canvas` is **darker** than `bg` here, where in the light theme it is darker
 * too: the staff sits in a well on both grounds rather than on a raised card,
 * which is what keeps the stave lines reading as paper and not as a surface.
 * An inverted ladder derived from the light theme got that one backwards.
 */
const dark: Theme = {
  colors: {
    bg: '#171613',
    surf: '#211f1b',
    canvas: '#0e0d0b',
    ink: '#f1ece2',
    muted: '#a39c8f',
    line: '#343029',
    soft: '#2a2722',
    accent: '#75aef5', // oklch(0.74 0.12 255)
    ok: '#6fc082', // oklch(0.74 0.12 150)
    late: '#e6b55d', // oklch(0.8 0.12 80)
    bad: '#f07f77', // oklch(0.72 0.14 25)
  },
  spacing,
  radii,
  typography,
};

export const themes = { light, dark } as const;
