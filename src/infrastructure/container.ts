import { Container } from 'inversify';

import { expoAppVersionReader } from '@/infrastructure/expo-app-version-reader';
import { expoKeyValueStore } from '@/infrastructure/expo-key-value-store';
import { createProgressStore } from '@/infrastructure/progress-store';
import { createSettingsStore } from '@/infrastructure/settings-store';
import { SYMBOLS } from '@/infrastructure/symbols';
import { createChooseNotation } from '@/usecases/choose-notation';
import { createGetAppVersion } from '@/usecases/get-app-version';
import { createGetProgress } from '@/usecases/get-progress';
import { createGetSettings } from '@/usecases/get-settings';
import { createRecordFinishedSession } from '@/usecases/record-finished-session';

export function createContainer(): Container {
  const container = new Container();

  container.bind(SYMBOLS.infrastructure.AppVersionReader).toConstantValue(expoAppVersionReader);
  container
    .bind(SYMBOLS.usecases.GetAppVersion)
    .toResolvedValue(createGetAppVersion, [SYMBOLS.infrastructure.AppVersionReader]);

  container
    .bind(SYMBOLS.infrastructure.ProgressStore)
    .toConstantValue(createProgressStore(expoKeyValueStore));
  container
    .bind(SYMBOLS.usecases.GetProgress)
    .toResolvedValue(createGetProgress, [SYMBOLS.infrastructure.ProgressStore]);
  container
    .bind(SYMBOLS.usecases.RecordFinishedSession)
    .toResolvedValue(createRecordFinishedSession, [SYMBOLS.infrastructure.ProgressStore]);

  container
    .bind(SYMBOLS.infrastructure.SettingsStore)
    .toConstantValue(createSettingsStore(expoKeyValueStore));
  container
    .bind(SYMBOLS.usecases.GetSettings)
    .toResolvedValue(createGetSettings, [SYMBOLS.infrastructure.SettingsStore]);
  container
    .bind(SYMBOLS.usecases.ChooseNotation)
    .toResolvedValue(createChooseNotation, [SYMBOLS.infrastructure.SettingsStore]);

  return container;
}
