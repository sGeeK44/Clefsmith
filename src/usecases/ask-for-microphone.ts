/**
 * Asking the learner for the microphone.
 *
 * What the answer is does not come back. The operating system is what holds it,
 * it can change from the settings at any moment without this application being
 * told, and a copy of it kept here would be stale the first time it is read.
 * What the application does when the microphone is refused is CLE-18's.
 */
export interface MicrophonePermission {
  request(): Promise<void>;
}

export type AskForMicrophone = () => Promise<void>;

export function createAskForMicrophone(permission: MicrophonePermission): AskForMicrophone {
  return () => permission.request();
}
