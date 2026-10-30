import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { openSettings } from 'expo-linking';

import type { MicrophonePermission } from '@/usecases/microphone-access';

/**
 * The system permission, asked once per installation by the operating system
 * itself.
 *
 * A second `request` on a learner who has already answered shows nothing — the
 * standing answer comes straight back — which is why nothing here has to
 * remember whether the question was put. `granted` never shows anything at all,
 * which is what makes it safe to call on every return to the foreground.
 */
export const expoMicrophonePermission: MicrophonePermission = {
  request: async () => (await requestRecordingPermissionsAsync()).granted,
  granted: async () => (await getRecordingPermissionsAsync()).granted,
  openSettings,
};
