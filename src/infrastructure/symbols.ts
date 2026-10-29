import type { ServiceIdentifier } from 'inversify';

import type { AskForMicrophone, MicrophonePermission } from '@/usecases/ask-for-microphone';
import type { ChooseNotation } from '@/usecases/choose-notation';
import type { FinishWelcome } from '@/usecases/finish-welcome';
import type { AppVersionReader, GetAppVersion } from '@/usecases/get-app-version';
import type { GetProgress, ProgressStore } from '@/usecases/get-progress';
import type { GetSettings, SettingsStore } from '@/usecases/get-settings';
import type { RecordFinishedSession } from '@/usecases/record-finished-session';

export const SYMBOLS = {
  infrastructure: {
    AppVersionReader: Symbol.for('AppVersionReader') as ServiceIdentifier<AppVersionReader>,
    MicrophonePermission: Symbol.for(
      'MicrophonePermission',
    ) as ServiceIdentifier<MicrophonePermission>,
    ProgressStore: Symbol.for('ProgressStore') as ServiceIdentifier<ProgressStore>,
    SettingsStore: Symbol.for('SettingsStore') as ServiceIdentifier<SettingsStore>,
  },
  usecases: {
    AskForMicrophone: Symbol.for('AskForMicrophone') as ServiceIdentifier<AskForMicrophone>,
    ChooseNotation: Symbol.for('ChooseNotation') as ServiceIdentifier<ChooseNotation>,
    FinishWelcome: Symbol.for('FinishWelcome') as ServiceIdentifier<FinishWelcome>,
    GetAppVersion: Symbol.for('GetAppVersion') as ServiceIdentifier<GetAppVersion>,
    GetProgress: Symbol.for('GetProgress') as ServiceIdentifier<GetProgress>,
    GetSettings: Symbol.for('GetSettings') as ServiceIdentifier<GetSettings>,
    RecordFinishedSession: Symbol.for(
      'RecordFinishedSession',
    ) as ServiceIdentifier<RecordFinishedSession>,
  },
} as const;
