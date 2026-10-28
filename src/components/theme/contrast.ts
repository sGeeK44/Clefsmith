/**
 * Contrast between two colours, as WCAG 2 defines it.
 *
 * The design tokens are checked against this rather than against numbers copied
 * from a contrast checker: a token changed by hand would leave the copied
 * number behind, saying the palette is still readable when it no longer is.
 */

/** Channel values below this point are linear; above it the transfer is a power curve. */
const LINEAR_CEILING = 0.04045;

/** WCAG's additive constant, which keeps the ratio finite for black on black. */
const FLARE = 0.05;

const COEFFICIENTS = { red: 0.2126, green: 0.7152, blue: 0.0722 };

/** `#rrggbb`, which is how every token in this repository is written. */
const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

export function contrastRatio(one: string, other: string): number {
  const first = relativeLuminance(one);
  const second = relativeLuminance(other);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + FLARE) / (darker + FLARE);
}

function relativeLuminance(color: string): number {
  const match = HEX.exec(color);

  if (match === null) {
    throw new Error(`${color} is not a #rrggbb colour.`);
  }

  const [red, green, blue] = match
    .slice(1)
    .map((channel) => linearise(Number.parseInt(channel, 16) / 255));

  return (
    COEFFICIENTS.red * (red as number) +
    COEFFICIENTS.green * (green as number) +
    COEFFICIENTS.blue * (blue as number)
  );
}

function linearise(channel: number): number {
  return channel <= LINEAR_CEILING ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
