import { Container } from 'inversify';

import { expoAppVersionReader } from '@/infrastructure/expo-app-version-reader';
import { expoKeyValueStore } from '@/infrastructure/expo-key-value-store';
import { createProgressStore } from '@/infrastructure/progress-store';
import { SYMBOLS } from '@/infrastructure/symbols';
import { createGetAppVersion } from '@/usecases/get-app-version';
import { createGetProgress } from '@/usecases/get-progress';
import { createRecordAnswer } from '@/usecases/record-answer';
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
    .bind(SYMBOLS.usecases.RecordAnswer)
    .toResolvedValue(createRecordAnswer, [SYMBOLS.infrastructure.ProgressStore]);
  container
    .bind(SYMBOLS.usecases.RecordFinishedSession)
    .toResolvedValue(createRecordFinishedSession, [SYMBOLS.infrastructure.ProgressStore]);

  return container;
}
