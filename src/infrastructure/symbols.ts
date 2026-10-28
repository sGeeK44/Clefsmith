import type { ServiceIdentifier } from 'inversify';

import type { AppVersionReader, GetAppVersion } from '@/usecases/get-app-version';
import type { GetProgress, ProgressStore } from '@/usecases/get-progress';
import type { RecordAnswer } from '@/usecases/record-answer';
import type { RecordFinishedSession } from '@/usecases/record-finished-session';

export const SYMBOLS = {
  infrastructure: {
    AppVersionReader: Symbol.for('AppVersionReader') as ServiceIdentifier<AppVersionReader>,
    ProgressStore: Symbol.for('ProgressStore') as ServiceIdentifier<ProgressStore>,
  },
  usecases: {
    GetAppVersion: Symbol.for('GetAppVersion') as ServiceIdentifier<GetAppVersion>,
    GetProgress: Symbol.for('GetProgress') as ServiceIdentifier<GetProgress>,
    RecordAnswer: Symbol.for('RecordAnswer') as ServiceIdentifier<RecordAnswer>,
    RecordFinishedSession: Symbol.for(
      'RecordFinishedSession',
    ) as ServiceIdentifier<RecordFinishedSession>,
  },
} as const;
