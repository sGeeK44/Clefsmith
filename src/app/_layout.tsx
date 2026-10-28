import { Stack } from 'expo-router';

import '@/components/theme/unistyles';

import { ContainerProvider } from '@/components/container-provider';
import { createContainer } from '@/infrastructure/container';

const container = createContainer();

export default function RootLayout() {
  return (
    <ContainerProvider container={container}>
      <Stack screenOptions={{ headerShown: false }} />
    </ContainerProvider>
  );
}
