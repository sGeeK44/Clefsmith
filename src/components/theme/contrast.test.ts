import { describe, expect, it } from 'bun:test';

import { contrastRatio } from '@/components/theme/contrast';

describe('contrast ratio', () => {
  it('is 21 between black and white, the widest two colours can be', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4);
  });

  it('is 1 between a colour and itself', () => {
    expect(contrastRatio('#346aac', '#346aac')).toBeCloseTo(1, 4);
  });

  it("reads WCAG's own borderline grey on white as just over 4.5", () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.5422, 3);
  });

  it('weighs the channels as the eye does, green far more than red', () => {
    expect(contrastRatio('#00ff00', '#ffffff')).toBeCloseTo(1.3722, 3);
    expect(contrastRatio('#ff0000', '#ffffff')).toBeCloseTo(3.9985, 3);
  });

  it('does not depend on which colour is given first', () => {
    expect(contrastRatio('#1f1c17', '#f5f1e8')).toBeCloseTo(
      contrastRatio('#f5f1e8', '#1f1c17'),
      10,
    );
  });

  it('refuses a colour it cannot read', () => {
    expect(() => contrastRatio('rebeccapurple', '#ffffff')).toThrow(
      'rebeccapurple is not a #rrggbb colour.',
    );
  });
});
