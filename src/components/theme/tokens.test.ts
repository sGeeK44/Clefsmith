import { describe, expect, it } from 'bun:test';

import { contrastRatio } from '@/components/theme/contrast';
import { type Colors, themes } from '@/components/theme/tokens';

/** Roles that carry running text, which WCAG holds to 4.5:1. */
const TEXT: (keyof Colors)[] = ['ink', 'muted'];

/**
 * Roles that carry state rather than prose — a right answer, a late one, a
 * wrong one, the one thing on screen asking to be acted on. WCAG holds
 * non-text content to 3:1, and the mockup's palette is built on that: `late`
 * reads 3.3:1 on the light ground.
 */
const STATE: (keyof Colors)[] = ['accent', 'ok', 'late', 'bad'];

describe('themes', () => {
  it('declare the same roles, so no screen loses a colour by changing the light', () => {
    expect(Object.keys(themes.dark.colors).sort()).toEqual(Object.keys(themes.light.colors).sort());
  });

  it('hold a readable text colour on their own ground', () => {
    const readings = Object.entries(themes).flatMap(([name, theme]) =>
      TEXT.map((role) => [
        `${name}.${role}`,
        contrastRatio(theme.colors[role], theme.colors.bg) >= 4.5,
      ]),
    );

    expect(readings).toEqual(readings.map(([where]) => [where, true]));
  });

  it('hold a distinguishable state colour on their own ground', () => {
    const readings = Object.entries(themes).flatMap(([name, theme]) =>
      STATE.map((role) => [
        `${name}.${role}`,
        contrastRatio(theme.colors[role], theme.colors.bg) >= 3,
      ]),
    );

    expect(readings).toEqual(readings.map(([where]) => [where, true]));
  });

  it('hold a readable label on the one fill a button is allowed to be', () => {
    const readings = Object.entries(themes).map(([name, theme]) => [
      name,
      contrastRatio(theme.colors.bg, theme.colors.ink) >= 4.5,
    ]);

    expect(readings).toEqual(readings.map(([where]) => [where, true]));
  });

  it('raise a surface above the page rather than beside it', () => {
    expect(contrastRatio(themes.light.colors.surf, themes.light.colors.bg)).toBeGreaterThan(1);
    expect(contrastRatio(themes.dark.colors.surf, themes.dark.colors.bg)).toBeGreaterThan(1);
  });
});
