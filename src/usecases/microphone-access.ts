/**
 * The microphone, as the application is allowed to use it.
 *
 * One port over the whole subject rather than one per question: asking, reading
 * the answer back and sending the learner to the settings are three faces of
 * the same platform permission, and three ports over it would be three adapters
 * nobody keeps in step.
 */

/**
 * The verdict, in the three states it can be in.
 *
 * `askable` and `blocked` are both refusals and lead to different screens: the
 * system puts its question once, and an application that has never put it has
 * no row in the system settings for the learner to switch. Offering the
 * settings there sends them looking for something that is not drawn yet.
 */
export type MicrophoneAccess = 'granted' | 'askable' | 'blocked';

/** A platform's answer about a permission, in the two facts every platform states. */
export interface PermissionAnswer {
  readonly granted: boolean;
  /** Whether the system would put its question again, or has stopped asking. */
  readonly canAskAgain: boolean;
}

export function accessOf({ granted, canAskAgain }: PermissionAnswer): MicrophoneAccess {
  if (granted) {
    return 'granted';
  }

  return canAskAgain ? 'askable' : 'blocked';
}

export interface MicrophonePermission {
  /** Puts the system question, and answers the verdict it left behind. */
  request(): Promise<MicrophoneAccess>;
  /** Answers the standing verdict without putting any question. */
  read(): Promise<MicrophoneAccess>;
  /** Opens this application's page in the system settings. */
  openSettings(): Promise<void>;
}

export type AskForMicrophone = () => Promise<MicrophoneAccess>;

export function createAskForMicrophone(permission: MicrophonePermission): AskForMicrophone {
  return () => permission.request();
}

/**
 * Whether a session can be started at all, and what is left to try when it
 * cannot.
 *
 * Read, never remembered: the operating system holds the verdict, it changes
 * from outside the application without it being told, and a copy is stale the
 * first time it is read.
 */
export type ReadMicrophoneAccess = () => Promise<MicrophoneAccess>;

export function createReadMicrophoneAccess(permission: MicrophonePermission): ReadMicrophoneAccess {
  return () => permission.read();
}

export type ShowMicrophoneSettings = () => Promise<void>;

export function createShowMicrophoneSettings(
  permission: MicrophonePermission,
): ShowMicrophoneSettings {
  return () => permission.openSettings();
}
