import { Container } from 'inversify';

import { mathRandom } from '@/core/math-random';

import { expoAppVersionReader } from '@/infrastructure/expo-app-version-reader';
import { expoKeyValueStore } from '@/infrastructure/expo-key-value-store';
import { expoMicrophonePermission } from '@/infrastructure/expo-microphone-permission';
import { createMemoryReportStore } from '@/infrastructure/memory-report-store';
import { createProgressStore } from '@/infrastructure/progress-store';
import { createSettingsStore } from '@/infrastructure/settings-store';
import { SYMBOLS } from '@/infrastructure/symbols';
import { systemClock } from '@/infrastructure/system-clock';
import { createChooseNotation } from '@/usecases/choose-notation';
import { createDrawSession } from '@/usecases/draw-session';
import { createFinishWelcome } from '@/usecases/finish-welcome';
import { createGetAppVersion } from '@/usecases/get-app-version';
import { createGetProgress } from '@/usecases/get-progress';
import { createGetSettings } from '@/usecases/get-settings';
import { createKeepReport, createRecallReport } from '@/usecases/keep-report';
import { createKeepTime } from '@/usecases/keep-time';
import { type AnswerSource, createListenForAnswers } from '@/usecases/listen-for-answers';
import {
  createAskForMicrophone,
  createReadMicrophoneAccess,
  createShowMicrophoneSettings,
} from '@/usecases/microphone-access';
import { createRecordFinishedSession } from '@/usecases/record-finished-session';
import { createResetProgress } from '@/usecases/reset-progress';

/**
 * Everything the application is made of, assembled once.
 *
 * The answer source is handed in rather than built here: hearing one means
 * importing `react-native-vosk`, a native module no test can load. The root
 * supplies it, exactly as the bench supplies its own recogniser.
 *
 * Every resolved binding is a singleton. `toResolvedValue` is transient by
 * default, so without it a screen asking for the same use case twice gets two
 * functions — and a screen asking on every render gets a new one every render.
 * An effect that depends on one then re-runs forever, which on the device means
 * the recogniser being started and stopped as fast as React can redraw.
 */
export function createContainer(answerSource: AnswerSource): Container {
  const container = new Container();

  container.bind(SYMBOLS.infrastructure.AppVersionReader).toConstantValue(expoAppVersionReader);
  container
    .bind(SYMBOLS.usecases.GetAppVersion)
    .toResolvedValue(createGetAppVersion, [SYMBOLS.infrastructure.AppVersionReader])
    .inSingletonScope();

  container
    .bind(SYMBOLS.infrastructure.ProgressStore)
    .toConstantValue(createProgressStore(expoKeyValueStore));
  container
    .bind(SYMBOLS.usecases.GetProgress)
    .toResolvedValue(createGetProgress, [SYMBOLS.infrastructure.ProgressStore])
    .inSingletonScope();
  container
    .bind(SYMBOLS.usecases.RecordFinishedSession)
    .toResolvedValue(createRecordFinishedSession, [SYMBOLS.infrastructure.ProgressStore])
    .inSingletonScope();
  container
    .bind(SYMBOLS.usecases.ResetProgress)
    .toResolvedValue(createResetProgress, [SYMBOLS.infrastructure.ProgressStore])
    .inSingletonScope();

  container
    .bind(SYMBOLS.infrastructure.SettingsStore)
    .toConstantValue(createSettingsStore(expoKeyValueStore));
  container
    .bind(SYMBOLS.usecases.GetSettings)
    .toResolvedValue(createGetSettings, [SYMBOLS.infrastructure.SettingsStore])
    .inSingletonScope();
  container
    .bind(SYMBOLS.usecases.ChooseNotation)
    .toResolvedValue(createChooseNotation, [SYMBOLS.infrastructure.SettingsStore])
    .inSingletonScope();

  container
    .bind(SYMBOLS.infrastructure.MicrophonePermission)
    .toConstantValue(expoMicrophonePermission);
  container
    .bind(SYMBOLS.usecases.AskForMicrophone)
    .toResolvedValue(createAskForMicrophone, [SYMBOLS.infrastructure.MicrophonePermission])
    .inSingletonScope();
  container
    .bind(SYMBOLS.usecases.ReadMicrophoneAccess)
    .toResolvedValue(createReadMicrophoneAccess, [SYMBOLS.infrastructure.MicrophonePermission])
    .inSingletonScope();
  container
    .bind(SYMBOLS.usecases.ShowMicrophoneSettings)
    .toResolvedValue(createShowMicrophoneSettings, [SYMBOLS.infrastructure.MicrophonePermission])
    .inSingletonScope();

  container
    .bind(SYMBOLS.usecases.FinishWelcome)
    .toResolvedValue(createFinishWelcome, [
      SYMBOLS.infrastructure.ProgressStore,
      SYMBOLS.infrastructure.SettingsStore,
    ])
    .inSingletonScope();

  container.bind(SYMBOLS.infrastructure.AnswerSource).toConstantValue(answerSource);
  container
    .bind(SYMBOLS.usecases.ListenForAnswers)
    .toResolvedValue(createListenForAnswers, [SYMBOLS.infrastructure.AnswerSource])
    .inSingletonScope();

  container.bind(SYMBOLS.usecases.DrawSession).toConstantValue(createDrawSession(mathRandom));
  container.bind(SYMBOLS.usecases.KeepTime).toConstantValue(createKeepTime(systemClock));

  container.bind(SYMBOLS.infrastructure.ReportStore).toConstantValue(createMemoryReportStore());
  container
    .bind(SYMBOLS.usecases.KeepReport)
    .toResolvedValue(createKeepReport, [SYMBOLS.infrastructure.ReportStore])
    .inSingletonScope();
  container
    .bind(SYMBOLS.usecases.RecallReport)
    .toResolvedValue(createRecallReport, [SYMBOLS.infrastructure.ReportStore])
    .inSingletonScope();

  return container;
}
