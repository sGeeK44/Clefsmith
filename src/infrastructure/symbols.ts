import type { ServiceIdentifier } from 'inversify';

import type { ChooseNotation } from '@/usecases/choose-notation';
import type { AppVersionReader, GetAppVersion } from '@/usecases/get-app-version';
import type { GetProgress, ProgressStore } from '@/usecases/get-progress';
import type { GetSettings, SettingsStore } from '@/usecases/get-settings';
import type { RecordFinishedSession } from '@/usecases/record-finished-session';

export const SYMBOLS = {
  infrastructure: {
    AppVersionReader: Symbol.for('AppVersionReader') as ServiceIdentifier<AppVersionReader>,
    ProgressStore: Symbol.for('ProgressStore') as ServiceIdentifier<ProgressStore>,
    SettingsStore: Symbol.for('SettingsStore') as ServiceIdentifier<SettingsStore>,
  },
  usecases: {
    ChooseNotation: Symbol.for('ChooseNotation') as ServiceIdentifier<ChooseNotation>,
    GetAppVersion: Symbol.for('GetAppVersion') as ServiceIdentifier<GetAppVersion>,
    GetProgress: Symbol.for('GetProgress') as ServiceIdentifier<GetProgress>,
    GetSettings: Symbol.for('GetSettings') as ServiceIdentifier<GetSettings>,
    RecordFinishedSession: Symbol.for(
      'RecordFinishedSession',
    ) as ServiceIdentifier<RecordFinishedSession>,
  },
} as const;
