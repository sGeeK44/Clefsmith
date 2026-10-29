import { requestRecordingPermissionsAsync } from 'expo-audio';

import type { MicrophonePermission } from '@/usecases/ask-for-microphone';

/**
 * The system prompt, asked once per installation by the operating system itself.
 *
 * A second call on a learner who has already answered does not show anything —
 * the answer comes straight back — which is why nothing here has to remember
 * whether the question was put.
 */
export const expoMicrophonePermission: MicrophonePermission = {
  request: async () => {
    await requestRecordingPermissionsAsync();
  },
};
