import type { ServiceIdentifier } from 'inversify';
import type { ChooseNotation } from '@/usecases/choose-notation';
import type { DrawSession } from '@/usecases/draw-session';
import type { FinishWelcome } from '@/usecases/finish-welcome';
import type { AppVersionReader, GetAppVersion } from '@/usecases/get-app-version';
import type { GetProgress, ProgressStore } from '@/usecases/get-progress';
import type { GetSettings, SettingsStore } from '@/usecases/get-settings';
import type { KeepReport, RecallReport, ReportStore } from '@/usecases/keep-report';
import type { KeepTime } from '@/usecases/keep-time';
import type { AnswerSource, ListenForAnswers } from '@/usecases/listen-for-answers';
import type {
  AskForMicrophone,
  MicrophonePermission,
  ReadMicrophoneAccess,
  ShowMicrophoneSettings,
} from '@/usecases/microphone-access';
import type { PlayClicks } from '@/usecases/play-clicks';
import type { RecordFinishedSession } from '@/usecases/record-finished-session';
import type { ResetProgress } from '@/usecases/reset-progress';

export const SYMBOLS = {
  infrastructure: {
    AnswerSource: Symbol.for('AnswerSource') as ServiceIdentifier<AnswerSource>,
    AppVersionReader: Symbol.for('AppVersionReader') as ServiceIdentifier<AppVersionReader>,
    ReportStore: Symbol.for('ReportStore') as ServiceIdentifier<ReportStore>,
    MicrophonePermission: Symbol.for(
      'MicrophonePermission',
    ) as ServiceIdentifier<MicrophonePermission>,
    ProgressStore: Symbol.for('ProgressStore') as ServiceIdentifier<ProgressStore>,
    SettingsStore: Symbol.for('SettingsStore') as ServiceIdentifier<SettingsStore>,
  },
  usecases: {
    AskForMicrophone: Symbol.for('AskForMicrophone') as ServiceIdentifier<AskForMicrophone>,
    ReadMicrophoneAccess: Symbol.for(
      'ReadMicrophoneAccess',
    ) as ServiceIdentifier<ReadMicrophoneAccess>,
    ShowMicrophoneSettings: Symbol.for(
      'ShowMicrophoneSettings',
    ) as ServiceIdentifier<ShowMicrophoneSettings>,
    ChooseNotation: Symbol.for('ChooseNotation') as ServiceIdentifier<ChooseNotation>,
    DrawSession: Symbol.for('DrawSession') as ServiceIdentifier<DrawSession>,
    FinishWelcome: Symbol.for('FinishWelcome') as ServiceIdentifier<FinishWelcome>,
    GetAppVersion: Symbol.for('GetAppVersion') as ServiceIdentifier<GetAppVersion>,
    GetProgress: Symbol.for('GetProgress') as ServiceIdentifier<GetProgress>,
    GetSettings: Symbol.for('GetSettings') as ServiceIdentifier<GetSettings>,
    KeepReport: Symbol.for('KeepReport') as ServiceIdentifier<KeepReport>,
    KeepTime: Symbol.for('KeepTime') as ServiceIdentifier<KeepTime>,
    PlayClicks: Symbol.for('PlayClicks') as ServiceIdentifier<PlayClicks>,
    ListenForAnswers: Symbol.for('ListenForAnswers') as ServiceIdentifier<ListenForAnswers>,
    RecallReport: Symbol.for('RecallReport') as ServiceIdentifier<RecallReport>,
    RecordFinishedSession: Symbol.for(
      'RecordFinishedSession',
    ) as ServiceIdentifier<RecordFinishedSession>,
    ResetProgress: Symbol.for('ResetProgress') as ServiceIdentifier<ResetProgress>,
  },
} as const;
