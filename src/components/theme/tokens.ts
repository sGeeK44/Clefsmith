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
    readonly family: Readonly<Record<'light' | 'regular' | 'medium' | 'semibold' | 'bold', string>>;
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
 * Derived, not drawn: the mockup has no dark palette.
 *
 * The warm hue is kept and the lightness ladder inverted role by role, so that
 * `surf` still reads as raised above `bg` and `canvas` still separates the staff
 * from the page. The status colours keep their hue and chroma and move up in
 * lightness, which is what a dark ground needs to keep them legible.
 */
const dark: Theme = {
  colors: {
    bg: '#16140f',
    surf: '#1f1c16',
    canvas: '#2a251d',
    ink: '#f2ede1',
    muted: '#a39a89',
    line: '#2f2a22',
    soft: '#262118',
    accent: '#639be1', // oklch(0.68 0.12 255)
    ok: '#63b376', // oklch(0.70 0.12 150)
    late: '#dea143', // oklch(0.75 0.13 75)
    bad: '#ef6661', // oklch(0.68 0.17 25)
  },
  spacing,
  radii,
  typography,
};

export const themes = { light, dark } as const;
