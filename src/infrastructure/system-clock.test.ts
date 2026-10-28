import { describe, expect, it } from 'bun:test';

import { systemClock } from '@/infrastructure/system-clock';

describe('system clock', () => {
  it('does not resolve before the instant it was given', async () => {
    const before = systemClock.now();

    await systemClock.sleepUntil(before + 50);

    expect(systemClock.now() - before).toBeGreaterThanOrEqual(50);
  });

  it('resolves on an instant that has already passed rather than waiting out the gap', async () => {
    const before = systemClock.now();

    await systemClock.sleepUntil(before - 10_000);

    expect(systemClock.now() - before).toBeLessThan(1_000);
  });
});
