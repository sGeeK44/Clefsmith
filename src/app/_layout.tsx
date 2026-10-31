import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AudioContext, AudioManager } from 'react-native-audio-api';
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

/**
 * The one audio session both engines share.
 *
 * The recogniser configures the session when it starts listening, and the
 * player configures it when a context is created. Left to their defaults they
 * contradict each other — the player asks for `playback`, which carries no
 * input, and the recogniser asked for `record`, which carries no output and
 * under which a player's clock never advances. Declared identically on both
 * sides, neither reconfiguration is a change, so neither tears the other down.
 *
 * `defaultToSpeaker` because `playAndRecord` otherwise comes out of the
 * receiver, and `measurement` because the recogniser wants the microphone
 * signal with as little system processing on it as possible.
 */
AudioManager.setAudioSessionOptions({
  iosCategory: 'playAndRecord',
  iosMode: 'measurement',
  iosOptions: ['defaultToSpeaker'],
});

/**
 * The metronome's click: a kilohertz sine over forty milliseconds, decaying by
 * `exp(-90t)`, mono at 48 kHz, peaking at 0.72 of full scale.
 *
 * Recorded rather than synthesised so that both platforms sound the same, and
 * uncompressed so that the attack lands on the sample it was written for — the
 * library decodes WAV through miniaudio on iOS and Android alike.
 */
const CLICK = require('../../assets/sounds/click.wav');

const container = createContainer(
  createVoskAnswerSource(vosk, MODEL_PATH, systemClock),
  createAudioApiClickTracks(() => new AudioContext(), CLICK),
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
