import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { EXERCISE } from '@/components/exercise-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ALLOW, BACK, TITLE, WHERE, WHY } from '@/components/wording/microphone';
import { SYMBOLS } from '@/infrastructure/symbols';
import type { MicrophoneAccess, MicrophoneRefusal } from '@/usecases/microphone-access';

const PARCOURS = '/studies';

/**
 * Where a session stops when the microphone is not granted.
 *
 * It carries the session it was stopping, so granting the permission and coming
 * back is the whole of what the learner has to do — the exercise starts on the
 * way in rather than asking them to set it up again.
 *
 * What it offers depends on which refusal it is standing on. While the system
 * would still put its question, the screen puts it: the settings page has no
 * microphone row until an application has asked at least once, so offering the
 * settings first is offering a dead end. Once the system has stopped asking,
 * the settings are the only way left.
 *
 * The verdict is re-read when the application comes back to the foreground,
 * because that is the only moment it can have changed behind its back: the
 * settings are another application, and nothing tells this one what happened
 * there.
 */
export default function MicrophoneScreen() {
  const session = useLocalSearchParams<Record<string, string>>();
  const readAccess = useService(SYMBOLS.usecases.ReadMicrophoneAccess);
  const askForMicrophone = useService(SYMBOLS.usecases.AskForMicrophone);
  const showSettings = useService(SYMBOLS.usecases.ShowMicrophoneSettings);
  const [refusal, setRefusal] = useState<MicrophoneRefusal>();

  /** Granted is not a state this screen has: it leaves instead. */
  const settle = useCallback(
    (access: MicrophoneAccess) => {
      if (access === 'granted') {
        router.replace({ pathname: EXERCISE, params: session });
        return;
      }

      setRefusal(access);
    },
    [session],
  );

  const reread = useCallback(() => void readAccess().then(settle), [readAccess, settle]);

  useEffect(reread, [reread]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        reread();
      }
    });

    return () => subscription.remove();
  }, [reread]);

  /** Nothing is drawn until the verdict is known: the two refusals read differently. */
  if (refusal === undefined) {
    return null;
  }

  return (
    <Screen>
      <Text variant="display">{TITLE}</Text>

      <Card>
        <Text tone="muted">{WHY}</Text>
      </Card>

      <Text tone="muted">{WHERE[refusal]}</Text>

      <View style={styles.spacer} />

      <Button
        label={ALLOW[refusal]}
        onPress={() =>
          refusal === 'askable' ? void askForMicrophone().then(settle) : void showSettings()
        }
        testID="microphone-allow"
      />
      <Button
        emphasis="quiet"
        label={BACK}
        onPress={() => router.replace(PARCOURS)}
        testID="microphone-back"
      />
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  spacer: { flex: 1 },
}));
