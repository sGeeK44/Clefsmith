import Constants from 'expo-constants';

import type { AppVersionReader } from '@/usecases/get-app-version';

const UNKNOWN_VERSION = 'unknown';

export const expoAppVersionReader: AppVersionReader = {
  read: () => Constants.expoConfig?.version ?? UNKNOWN_VERSION,
};
