import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/components/theme/unistyles';

import { ContainerProvider, useService } from '@/components/container-provider';
import { createContainer } from '@/infrastructure/container';
import { SYMBOLS } from '@/infrastructure/symbols';

const container = createContainer();

const WELCOME = '/welcome';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ContainerProvider container={container}>
        <Launch />
      </ContainerProvider>
    </SafeAreaProvider>
  );
}

/**
 * Where the application opens, decided once while the native splash is still up.
 *
 * The stack is mounted from the first frame — a redirect asked for before there
 * is a navigator goes nowhere — and the splash is what hides the desk until the
 * decision has been applied. It comes down as soon as the record has been read
 * and not a moment later: an introduction worth seeing does not need a wait in
 * front of it.
 */
function Launch() {
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    getSettings().then((settings) => {
      if (!settings.welcomed) {
        router.replace(WELCOME);
      }

      setDecided(true);
    });
  }, [getSettings]);

  useEffect(() => {
    if (decided) {
      SplashScreen.hideAsync();
    }
  }, [decided]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
