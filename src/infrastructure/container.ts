import { Container } from 'inversify';

import { mathRandom } from '@/core/math-random';

import { expoAppVersionReader } from '@/infrastructure/expo-app-version-reader';
import { expoKeyValueStore } from '@/infrastructure/expo-key-value-store';
import { expoMicrophonePermission } from '@/infrastructure/expo-microphone-permission';
import { createMemoryReportStore } from '@/infrastructure/memory-report-store';
import { createProgressStore } from '@/infrastructure/progress-store';
import { createSettingsStore } from '@/infrastructure/settings-store';
import { silentAnswerSource } from '@/infrastructure/silent-answer-source';
import { SYMBOLS } from '@/infrastructure/symbols';
import { createAskForMicrophone } from '@/usecases/ask-for-microphone';
import { createChooseNotation } from '@/usecases/choose-notation';
import { createDrawSession } from '@/usecases/draw-session';
import { createFinishWelcome } from '@/usecases/finish-welcome';
import { createGetAppVersion } from '@/usecases/get-app-version';
import { createGetProgress } from '@/usecases/get-progress';
import { createGetSettings } from '@/usecases/get-settings';
import { createKeepReport, createRecallReport } from '@/usecases/keep-report';
import { createListenForAnswers } from '@/usecases/listen-for-answers';
import { createRecordFinishedSession } from '@/usecases/record-finished-session';
import { createResetProgress } from '@/usecases/reset-progress';

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
    .bind(SYMBOLS.usecases.ResetProgress)
    .toResolvedValue(createResetProgress, [SYMBOLS.infrastructure.ProgressStore]);

  container
    .bind(SYMBOLS.infrastructure.SettingsStore)
    .toConstantValue(createSettingsStore(expoKeyValueStore));
  container
    .bind(SYMBOLS.usecases.GetSettings)
    .toResolvedValue(createGetSettings, [SYMBOLS.infrastructure.SettingsStore]);
  container
    .bind(SYMBOLS.usecases.ChooseNotation)
    .toResolvedValue(createChooseNotation, [SYMBOLS.infrastructure.SettingsStore]);

  container
    .bind(SYMBOLS.infrastructure.MicrophonePermission)
    .toConstantValue(expoMicrophonePermission);
  container
    .bind(SYMBOLS.usecases.AskForMicrophone)
    .toResolvedValue(createAskForMicrophone, [SYMBOLS.infrastructure.MicrophonePermission]);

  container
    .bind(SYMBOLS.usecases.FinishWelcome)
    .toResolvedValue(createFinishWelcome, [
      SYMBOLS.infrastructure.ProgressStore,
      SYMBOLS.infrastructure.SettingsStore,
    ]);

  container.bind(SYMBOLS.infrastructure.AnswerSource).toConstantValue(silentAnswerSource);
  container
    .bind(SYMBOLS.usecases.ListenForAnswers)
    .toResolvedValue(createListenForAnswers, [SYMBOLS.infrastructure.AnswerSource]);

  container.bind(SYMBOLS.usecases.DrawSession).toConstantValue(createDrawSession(mathRandom));

  container.bind(SYMBOLS.infrastructure.ReportStore).toConstantValue(createMemoryReportStore());
  container
    .bind(SYMBOLS.usecases.KeepReport)
    .toResolvedValue(createKeepReport, [SYMBOLS.infrastructure.ReportStore]);
  container
    .bind(SYMBOLS.usecases.RecallReport)
    .toResolvedValue(createRecallReport, [SYMBOLS.infrastructure.ReportStore]);

  return container;
}
