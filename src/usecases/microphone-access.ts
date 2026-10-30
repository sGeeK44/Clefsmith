/**
 * The microphone, as the application is allowed to use it.
 *
 * One port over the whole subject rather than one per question: asking, reading
 * the answer back and sending the learner to the settings are three faces of
 * the same platform permission, and three ports over it would be three adapters
 * nobody keeps in step.
 *
 * The verdict is **binary**. A refusal that can be asked again and one that
 * cannot lead to the same screen with the same way out, and a permission never
 * asked for is neither yet behaves like both.
 */
export interface MicrophonePermission {
  /** Puts the system question, and answers what the learner said. */
  request(): Promise<boolean>;
  /** Answers the standing verdict without putting any question. */
  granted(): Promise<boolean>;
  /** Opens this application's page in the system settings. */
  openSettings(): Promise<void>;
}

export type AskForMicrophone = () => Promise<boolean>;

export function createAskForMicrophone(permission: MicrophonePermission): AskForMicrophone {
  return () => permission.request();
}

/**
 * Whether a session can be started at all.
 *
 * Read, never remembered: the operating system holds the verdict, it changes
 * from outside the application without it being told, and a copy is stale the
 * first time it is read.
 */
export type MayListen = () => Promise<boolean>;

export function createMayListen(permission: MicrophonePermission): MayListen {
  return () => permission.granted();
}

export type ShowMicrophoneSettings = () => Promise<void>;

export function createShowMicrophoneSettings(
  permission: MicrophonePermission,
): ShowMicrophoneSettings {
  return () => permission.openSettings();
}
