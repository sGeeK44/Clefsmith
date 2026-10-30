import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AudioContext } from 'react-native-audio-api';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as vosk from 'react-native-vosk';

import '@/components/theme/unistyles';

import { ContainerProvider, useService } from '@/components/container-provider';
import { Splash } from '@/components/splash';
import { createAudioApiClickTracks } from '@/infrastructure/audio-api-click-track';
import { createContainer } from '@/infrastructure/container';
import { SYMBOLS } from '@/infrastructure/symbols';
import { systemClock } from '@/infrastructure/system-clock';
import { createVoskAnswerSource } from '@/infrastructure/vosk-answer-source';

/**
 * The folder the Vosk model is unpacked from, placed into the native build by
 * the `react-native-vosk` config plugin. The same model the bench measures on.
 */
const MODEL_PATH = 'vosk-model-small-fr-0.22';

const container = createContainer(
  createVoskAnswerSource(vosk, MODEL_PATH, systemClock),
  createAudioApiClickTracks(() => new AudioContext()),
);

const WELCOME = '/welcome';

/**
 * How long the opening screen is held up once there is nothing left to wait for.
 *
 * A mark worth drawing is worth reading, and a splash that leaves before the eye
 * has landed on it reads as a glitch. It is a hold, not a loading time: a tap
 * ends it, and the decision below it has already been made.
 */
const HELD_MS = 1600;

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
  const [held, setHeld] = useState(true);

  useEffect(() => {
    getSettings().then((settings) => {
      if (!settings.welcomed) {
        router.replace(WELCOME);
      }

      setDecided(true);
    });
  }, [getSettings]);

  useEffect(() => {
    const timer = setTimeout(() => setHeld(false), HELD_MS);

    return () => clearTimeout(timer);
  }, []);

  /**
   * The native splash comes down on the first frame, under our own.
   *
   * It is a single image on a colour and cannot carry the words; ours is drawn
   * above the stack and hides it until the decision has been applied. Waiting
   * for the decision here would stack two splashes end to end.
   */
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {(held || !decided) && <Splash onSkip={() => setHeld(false)} />}
    </>
  );
}
