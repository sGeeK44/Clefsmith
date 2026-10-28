import { describe, expect, it } from 'bun:test';

import { p95 } from '@/domain/latency';

describe('p95 latency', () => {
  it('publishes the slowest of the fastest 95 %', () => {
    const oneToAHundred = Array.from({ length: 100 }, (_, index) => index + 1);

    expect(p95(oneToAHundred)).toBe(95);
  });

  it('reads the samples in order whatever order they were measured in', () => {
    expect(p95([300, 10, 20, 40, 30])).toBe(300);
  });

  it('publishes a latency that was actually measured rather than one between two', () => {
    expect(p95([10, 1000])).toBe(1000);
  });

  it('publishes the single sample of a single measurement', () => {
    expect(p95([42])).toBe(42);
  });

  it('refuses to call a run that measured nothing fast', () => {
    expect(p95([])).toBeNaN();
  });
});
