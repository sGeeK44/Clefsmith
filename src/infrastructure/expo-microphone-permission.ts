import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { openSettings } from 'expo-linking';

import { accessOf, type MicrophonePermission } from '@/usecases/microphone-access';

/**
 * The system permission, read through `expo-audio`.
 *
 * The adapter only hands the platform's two facts over; which verdict they add
 * up to is the application's rule, and it is tested as one. `canAskAgain` is
 * the platform's own word for the distinction: its documentation says that when
 * it is false the learner should be directed to the settings application.
 */
export const expoMicrophonePermission: MicrophonePermission = {
  request: async () => accessOf(await requestRecordingPermissionsAsync()),
  read: async () => accessOf(await getRecordingPermissionsAsync()),
  openSettings,
};
