import { describe, expect, it } from 'bun:test';
import { settingsHolding } from '#test/settings-store';
import { createGetSettings } from '@/usecases/get-settings';

describe('reading the settings', () => {
  it('answers with what the store holds', async () => {
    expect(
      await createGetSettings(settingsHolding({ notation: 'letters', welcomed: true }))(),
    ).toEqual({ notation: 'letters', welcomed: true });
  });
});
