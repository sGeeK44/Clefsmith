import { describe, expect, it } from 'bun:test';

import type { Report } from '@/domain/training/report';
import { createMemoryReportStore } from '@/infrastructure/memory-report-store';

const read: Report = { level: 3, review: false, accuracy: 100, missed: [], opened: 4 };

describe('the report of the last session', () => {
  it('has nothing to show before a session has been played', () => {
    expect(createMemoryReportStore().last()).toBeUndefined();
  });

  it('hands back the report it was given', () => {
    const store = createMemoryReportStore();

    store.keep(read);

    expect(store.last()).toEqual(read);
  });

  it('holds the last session, not the one before it', () => {
    const store = createMemoryReportStore();

    store.keep(read);
    store.keep({ ...read, accuracy: 60, opened: undefined });

    expect(store.last()?.accuracy).toBe(60);
  });

  it('is a slot of its own: two stores do not see each other', () => {
    const store = createMemoryReportStore();

    store.keep(read);

    expect(createMemoryReportStore().last()).toBeUndefined();
  });
});
