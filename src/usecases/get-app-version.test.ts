import { describe, expect, it } from 'bun:test';

import { createGetAppVersion } from '@/usecases/get-app-version';

describe('get app version', () => {
  it('returns the version its reader provides', () => {
    const getAppVersion = createGetAppVersion({ read: () => '1.4.2' });

    expect(getAppVersion()).toBe('1.4.2');
  });
});
