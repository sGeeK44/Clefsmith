import type { ServiceIdentifier } from 'inversify';

import type { AppVersionReader, GetAppVersion } from '@/usecases/get-app-version';

export const SYMBOLS = {
  infrastructure: {
    AppVersionReader: Symbol.for('AppVersionReader') as ServiceIdentifier<AppVersionReader>,
  },
  usecases: {
    GetAppVersion: Symbol.for('GetAppVersion') as ServiceIdentifier<GetAppVersion>,
  },
} as const;
