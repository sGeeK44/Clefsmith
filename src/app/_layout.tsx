import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/components/theme/unistyles';

import { ContainerProvider } from '@/components/container-provider';
import { createContainer } from '@/infrastructure/container';

const container = createContainer();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ContainerProvider container={container}>
        <Stack screenOptions={{ headerShown: false }} />
      </ContainerProvider>
    </SafeAreaProvider>
  );
}
